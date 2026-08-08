"""
Migration script to move data from MongoDB to Supabase.
Run this after setting up Supabase schema and before switching to Supabase auth.
"""
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from supabase import create_client
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

MONGO_URL = os.environ.get('MONGO_URL') or os.environ.get('MONGODB_URI')
DB_NAME = os.environ.get('DB_NAME', 'study_app')
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')

if not all([MONGO_URL, SUPABASE_URL, SUPABASE_SERVICE_KEY]):
    print("Missing required environment variables")
    exit(1)

mongo_client = AsyncIOMotorClient(MONGO_URL)
mongo_db = mongo_client[DB_NAME]
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


async def migrate_users():
    print("Migrating users...")
    users = await mongo_db.users.find({}).to_list(None)
    
    for user in users:
        try:
            # Create user in Supabase Auth
            auth_response = supabase.auth.admin.create_user({
                "email": user["email"],
                "password": user.get("hashed_password", "TempPass123!"),
                "email_confirm": user.get("email_verified", False),
                "user_metadata": {"name": user.get("name", user["email"].split("@")[0])}
            })
            
            if auth_response.user:
                # Update profile with additional fields
                supabase.table("profiles").upsert({
                    "id": auth_response.user.id,
                    "email": user["email"],
                    "name": user.get("name", user["email"].split("@")[0]),
                    "is_active": user.get("is_active", True),
                    "is_admin": user.get("is_admin", False),
                    "created_at": user.get("created_at"),
                }).execute()
                print(f"  Migrated: {user['email']}")
        except Exception as e:
            print(f"  Error migrating {user.get('email')}: {e}")


async def migrate_study_plans():
    print("Migrating study plans...")
    plans = await mongo_db.study_plans.find({}).to_list(None)
    
    for plan in plans:
        try:
            # Find user in Supabase by email
            user_result = supabase.table("profiles").select("id").eq("email", plan.get("user_email")).execute()
            
            if user_result.data:
                user_id = user_result.data[0]["id"]
                supabase.table("study_plans").insert({
                    "user_id": user_id,
                    "title": plan.get("title"),
                    "description": plan.get("description"),
                    "subjects": plan.get("subjects", []),
                    "schedule": plan.get("schedule", {}),
                    "is_active": plan.get("is_active", True),
                    "created_at": plan.get("created_at"),
                }).execute()
                print(f"  Migrated plan: {plan.get('title')}")
        except Exception as e:
            print(f"  Error migrating plan: {e}")


async def main():
    print("Starting MongoDB to Supabase migration...")
    await migrate_users()
    await migrate_study_plans()
    print("Migration complete!")


if __name__ == "__main__":
    asyncio.run(main())