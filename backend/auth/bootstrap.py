import argparse
from getpass import getpass

from backend.auth.service import AccountProvisioningError, provision_account
from backend.database.connection import SessionLocal


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Create an authentication account for an existing gym record."
    )
    parser.add_argument("--email", required=True, help="Account email address")
    parser.add_argument("--role", required=True, choices=("Admin", "Trainer", "Member"))
    parser.add_argument("--member-id", help="Required for Member accounts")
    parser.add_argument("--trainer-id", help="Required for Trainer accounts")
    args = parser.parse_args()

    password = getpass("New password (minimum 12 characters): ")
    confirmation = getpass("Confirm password: ")
    if password != confirmation:
        parser.error("Passwords do not match.")

    db = SessionLocal()
    try:
        account_id = provision_account(
            db,
            email=args.email,
            password=password,
            role=args.role,
            member_id=args.member_id,
            trainer_employee_id=args.trainer_id,
        )
    except (AccountProvisioningError, ValueError) as error:
        db.rollback()
        parser.error(str(error))
    finally:
        db.close()

    print(f"Created {args.role} account {account_id} for {args.email.strip().lower()}.")


if __name__ == "__main__":
    main()
