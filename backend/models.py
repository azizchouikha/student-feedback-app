from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
import json
from extensions import db

# Mixin DRY pour les timestamps
class TimestampMixin(object):
    created_at = db.Column(db.DateTime, default=func.now(), nullable=False)
    updated_at = db.Column(db.DateTime, default=func.now(), onupdate=func.now(), nullable=False)

class UserRole(enum.Enum):
    STUDENT = "student"
    ADMIN = "admin"
    MODERATOR = "moderator"

class ProblemStatus(enum.Enum):
    SUBMITTED = "Soumis"
    IN_PROGRESS = "En cours de traitement"
    RESOLVED = "Problème traité"
    REJECTED = "Rejeté"
    DUPLICATE = "Doublon"

class UrgencyLevel(enum.Enum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3

class User(db.Model, TimestampMixin):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    surname = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), default=UserRole.STUDENT.value, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    email_verified = db.Column(db.Boolean, default=False, nullable=False)
    last_login = db.Column(db.DateTime)
    
    # Relationships
    problems = db.relationship("Problem", back_populates="user", cascade="all, delete-orphan", foreign_keys="Problem.user_id")
    assigned_problems = db.relationship("Problem", foreign_keys="Problem.assigned_to")
    likes = db.relationship("ProblemLike", back_populates="user", cascade="all, delete-orphan")
    comments = db.relationship("Comment", back_populates="user", cascade="all, delete-orphan")
    notifications = db.relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', role='{self.role}')>"

class Problem(db.Model, TimestampMixin):
    __tablename__ = 'problems'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    promotion = db.Column(db.String(50), nullable=False)
    room = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    type_of_problem = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    other = db.Column(db.Text)
    urgency = db.Column(db.Integer, nullable=False)
    remark = db.Column(db.Text, nullable=False)
    state = db.Column(db.String(50), default=ProblemStatus.SUBMITTED.value, nullable=False)
    message = db.Column(db.Text)
    likes_count = db.Column(db.Integer, default=0, nullable=False)
    views_count = db.Column(db.Integer, default=0, nullable=False)
    priority_score = db.Column(db.Integer, default=0, nullable=False)
    estimated_resolution_time = db.Column(db.Integer)  # in hours
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'))
    tags = db.Column(db.Text)
    location_coordinates = db.Column(db.Text)
    resolved_at = db.Column(db.DateTime)
    
    # Relationships
    user = db.relationship("User", back_populates="problems", foreign_keys=[user_id])
    assigned_user = db.relationship("User", foreign_keys=[assigned_to])
    likes = db.relationship("ProblemLike", back_populates="problem", cascade="all, delete-orphan")
    comments = db.relationship("Comment", back_populates="problem", cascade="all, delete-orphan")
    attachments = db.relationship("Attachment", back_populates="problem", cascade="all, delete-orphan")
    history = db.relationship("ProblemHistory", back_populates="problem", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Problem(id={self.id}, room='{self.room}', category='{self.category}')>"

class ProblemLike(db.Model, TimestampMixin):
    __tablename__ = 'problem_likes'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    problem_id = db.Column(db.Integer, db.ForeignKey('problems.id'), nullable=False)
    
    # Relationships
    user = db.relationship("User", back_populates="likes")
    problem = db.relationship("Problem", back_populates="likes")
    
    def __repr__(self):
        return f"<ProblemLike(user_id={self.user_id}, problem_id={self.problem_id})>"

class Comment(db.Model, TimestampMixin):
    __tablename__ = 'comments'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    problem_id = db.Column(db.Integer, db.ForeignKey('problems.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    is_internal = db.Column(db.Boolean, default=False, nullable=False)  # Internal admin comments
    
    # Relationships
    user = db.relationship("User", back_populates="comments")
    problem = db.relationship("Problem", back_populates="comments")
    
    def __repr__(self):
        return f"<Comment(id={self.id}, problem_id={self.problem_id})>"

class Attachment(db.Model):
    __tablename__ = 'attachments'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    problem_id = db.Column(db.Integer, db.ForeignKey('problems.id'), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)
    mime_type = db.Column(db.String(100), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=func.now(), nullable=False)
    
    # Relationships
    problem = db.relationship("Problem", back_populates="attachments")
    
    def __repr__(self):
        return f"<Attachment(id={self.id}, filename='{self.filename}')>"

class ProblemHistory(db.Model):
    __tablename__ = 'problem_history'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    problem_id = db.Column(db.Integer, db.ForeignKey('problems.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    action = db.Column(db.String(100), nullable=False)  # status_change, comment_added, etc.
    old_value = db.Column(db.Text)
    new_value = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=func.now(), nullable=False)
    
    # Relationships
    problem = db.relationship("Problem", back_populates="history")
    user = db.relationship("User")
    
    def __repr__(self):
        return f"<ProblemHistory(id={self.id}, action='{self.action}')>"

class Notification(db.Model, TimestampMixin):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(50), nullable=False)  # problem_update, comment, system
    is_read = db.Column(db.Boolean, default=False, nullable=False)
    data = db.Column(db.Text)
    
    # Relationships
    user = db.relationship("User", back_populates="notifications")
    
    def __repr__(self):
        return f"<Notification(id={self.id}, type='{self.type}')>"

class Analytics(db.Model):
    __tablename__ = 'analytics'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    date = db.Column(db.DateTime, nullable=False, index=True)
    total_problems = db.Column(db.Integer, default=0)
    resolved_problems = db.Column(db.Integer, default=0)
    avg_resolution_time = db.Column(db.Integer)  # in hours
    problems_by_category = db.Column(db.Text)
    problems_by_urgency = db.Column(db.Text)
    active_users = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=func.now(), nullable=False)
    
    def __repr__(self):
        return f"<Analytics(date='{self.date}', total_problems={self.total_problems})>" 