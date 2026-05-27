from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import hash_password

db = SessionLocal()
if not db.query(User).filter(User.email == 'admin@cloudlog.com').first():
    db.add(User(email='admin@cloudlog.com', password_hash=hash_password('Admin@123')))
    db.commit()
print('Seeded admin user: admin@cloudlog.com / Admin@123')
