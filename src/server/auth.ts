import { env } from "@/env";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from 'bcrypt';
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";

const saltRounds = 10;

const secretJWT = env.JWT_SECRET;
const keyJWT = new TextEncoder().encode(secretJWT);

export async function encrypt(payload: any) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("1 week from now")
        .sign(keyJWT);
}

export async function decrypt(input: string): Promise<any> {
    const { payload } = await jwtVerify(input, keyJWT, {
        algorithms: ["HS256"],
    });
    return payload;
}

export async function register(formData: FormData) {
    const user = formData.get("username")?.toString();
    const password = formData.get("password")?.toString();
    if (!user || !password) {
        console.log("lmao one of these is missing")
        return false;
    }

    const userExists = (await db.select().from(users).where(eq(users.name, user))).length > 0;
    if (userExists) {
        return false;
    }

    const salt = bcrypt.genSaltSync(saltRounds)
    const hash = bcrypt.hashSync(password, salt)

    const result = await db.insert(users).values({
        name: user,
        pass: hash
    }).returning({ insertedId: users.id })

    if(result.length > 0) {
        return true;
    }
    else return false;
}

export async function login(formData: FormData) {
    const user = formData.get("username")?.toString();
    const password = formData.get("password")?.toString();
    if (!user || !password) {
        console.log("lmao one of these is missing")
        return;
    }

    // verify
    const dbUser = await db.select().from(users).where(eq(users.name, user)).limit(1);
    if (!dbUser[0]) return false;

    const match = await bcrypt.compare(password, dbUser[0].pass)
    if (!match) return false;

    // Create the session
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // milliseconds to week
    const uid = dbUser[0].id
    const session = await encrypt({ user, expires, uid });

    // Save the session in a cookie
    (await cookies()).set("session", session, { expires, httpOnly: true });
    return true;
}

export async function logout() {
    // Destroy the session
    (await cookies()).set("session", "", { expires: new Date(0) });
}

export async function getSession() {
    const session = (await cookies()).get("session")?.value;
    if (!session) return null;
    return await decrypt(session);
}

export async function updateSession(request: NextRequest) {
    const session = request.cookies.get("session")?.value;
    if (!session) return;

    // Refresh the session so it doesn't expire
    const parsed = await decrypt(session);
    parsed.expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // milliseconds to week
    const res = NextResponse.next();
    res.cookies.set({
        name: "session",
        value: await encrypt(parsed),
        httpOnly: true,
        expires: parsed.expires,
    });
    return res;
}