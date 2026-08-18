from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = "users"

    id              = db.Column(db.Integer,     primary_key=True, autoincrement=True)
    email           = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash   = db.Column(db.String(256), nullable=False)
    role            = db.Column(db.String(20),  nullable=False, default="individual")
    company_name    = db.Column(db.String(100), nullable=True,  default=None)
    approval_status = db.Column(db.String(20),  nullable=False, default="pending")

    scans   = db.relationship("ScanResult", backref="user", lazy=True, cascade="all, delete-orphan")
    reviews = db.relationship("Review", backref="user", lazy=True, cascade="all, delete-orphan")
    # New Relationship for the Multi-Agent Table
    ai_reports = db.relationship("AIReport", backref="user", lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User id={self.id} email={self.email} role={self.role}>"


class ScanResult(db.Model):
    __tablename__ = "scan_results"
    __table_args__ = (db.Index("idx_user_history", "user_id", "timestamp"),)

    id                        = db.Column(db.Integer,     primary_key=True, autoincrement=True)
    user_id                   = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    target_input              = db.Column(db.String(255), nullable=False)
    scan_type                 = db.Column(db.String(50),  nullable=False)
    risk_level                = db.Column(db.String(20),  nullable=False)  
    executive_summary         = db.Column(db.Text,        nullable=False)  
    threat_actor_exploitation = db.Column(db.Text,        nullable=True)   
    infrastructure_map        = db.Column(db.JSON,        nullable=True)   
    total_threat_count        = db.Column(db.Integer,     nullable=False, default=0)
    timestamp                 = db.Column(db.DateTime, nullable=False, server_default=db.func.now())

    sources = db.relationship("FetchedSource", backref="scan", lazy=True, cascade="all, delete-orphan")
    ai_report = db.relationship("AIReport", backref="scan", uselist=False, lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ScanResult id={self.id} target={self.target_input} risk={self.risk_level}>"

class FetchedSource(db.Model):
    __tablename__ = "fetched_sources"
    __table_args__ = (db.Index("idx_scan_sources", "scan_id"),)

    id           = db.Column(db.Integer, primary_key=True, autoincrement=True)
    scan_id      = db.Column(db.Integer, db.ForeignKey("scan_results.id", ondelete="CASCADE"), nullable=False)
    vector_name  = db.Column(db.String(50),  nullable=False)
    source_title = db.Column(db.String(255), nullable=False)   
    source_url   = db.Column(db.Text,        nullable=False)   

    def __repr__(self):
        return f"<FetchedSource id={self.id} scan={self.scan_id} vector={self.vector_name}>"

class Review(db.Model):
    __tablename__ = "reviews"

    id      = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rating  = db.Column(db.Integer, nullable=False)   
    comment = db.Column(db.Text,    nullable=True)    

    def __repr__(self):
        return f"<Review id={self.id} user={self.user_id} rating={self.rating}>"
class AIReport(db.Model):
    __tablename__ = "ai_reports"

    id                = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id           = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    scan_id           = db.Column(db.Integer, db.ForeignKey("scan_results.id", ondelete="CASCADE"), nullable=False)
    detailed_output   = db.Column(db.Text, nullable=False)
    summarized_output = db.Column(db.JSON, nullable=False)
    timestamp         = db.Column(db.DateTime, nullable=False, server_default=db.func.now())

