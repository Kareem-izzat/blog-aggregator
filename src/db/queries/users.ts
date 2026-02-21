import {db} from "..";
import { users } from "../schema";
import { eq } from "drizzle-orm";
export async function createUser(name:string){
    const [result] = await db
    .insert(users)
    .values({name:name})
    .returning();
    return result;
}
export async function findUserByName(name:string){
    const [user] = await db
    .select()
    .from(users)
    .where(eq(users.name,name));
    return user;
}

export async function deleteAllUsers(){
    await db.delete(users);
}
export async function getUsers(){
    const allUsers = await db.select().from(users);
    return allUsers;
}