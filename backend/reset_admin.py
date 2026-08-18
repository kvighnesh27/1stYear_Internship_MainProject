from app import app, db, User
from werkzeug.security import generate_password_hash

with app.app_context():
    # Find the admin user you created via SQL
    admin = User.query.filter_by(email="admin@example.com").first()
    
    if admin:
        # Let Werkzeug generate a fresh, uncorrupted hash and save it natively
        admin.password_hash = generate_password_hash("helloadmin")
        admin.role = "admin"
        admin.approval_status = "approved"
        
        db.session.commit()
        print("Success! The hash is fixed and saved. You can now log in.")
    else:
        print("Could not find admin@example.com in the database.")