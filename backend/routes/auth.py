from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from flask_bcrypt import Bcrypt
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from marshmallow import Schema, fields, validate, ValidationError
from datetime import datetime, timedelta
import re
from flask_sqlalchemy import SQLAlchemy
from models import User, UserRole, Notification
from extensions import db, bcrypt, limiter

auth_bp = Blueprint('auth', __name__)

# Validation schemas
class LoginSchema(Schema):
    email = fields.Email(required=True, validate=validate.Length(min=5, max=255))
    password = fields.Str(required=True, validate=validate.Length(min=6, max=100))

class RegisterSchema(Schema):
    email = fields.Email(required=True, validate=validate.Length(min=5, max=255))
    password = fields.Str(required=True, validate=validate.Length(min=8, max=100))
    name = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    surname = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    role = fields.Str(validate=validate.OneOf(['student', 'admin', 'moderator']))

class PasswordResetSchema(Schema):
    email = fields.Email(required=True)

class ChangePasswordSchema(Schema):
    current_password = fields.Str(required=True)
    new_password = fields.Str(required=True, validate=validate.Length(min=8, max=100))

# Validation functions
def validate_password_strength(password):
    """Validate password strength"""
    if len(password) < 8:
        raise ValidationError("Password must be at least 8 characters long")
    if not re.search(r"[A-Z]", password):
        raise ValidationError("Password must contain at least one uppercase letter")
    if not re.search(r"[a-z]", password):
        raise ValidationError("Password must contain at least one lowercase letter")
    if not re.search(r"\d", password):
        raise ValidationError("Password must contain at least one digit")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        raise ValidationError("Password must contain at least one special character")

@auth_bp.route('/register/', methods=['POST', 'OPTIONS'])
@limiter.limit("5 per minute")
def register():
    """Register a new user"""
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        schema = RegisterSchema()
        data = schema.load(request.json)
        
        # Validate password strength
        validate_password_strength(data['password'])
        
        # Check if user already exists
        existing_user = db.session.query(User).filter_by(email=data['email']).first()
        if existing_user:
            return jsonify({"error": "User with this email already exists"}), 409
        
        # Hash password
        password_hash = bcrypt.generate_password_hash(data['password']).decode('utf-8')
        
        # Create user with string role value
        user = User(
            email=data['email'],
            password_hash=password_hash,
            name=data['name'],
            surname=data['surname'],
            role=data.get('role', 'student')  # Use string directly
        )
        
        db.session.add(user)
        db.session.commit()
        
        # Create welcome notification
        notification = Notification(
            user_id=user.id,
            title="Welcome to EasyReport!",
            message=f"Hello {user.name}, welcome to our platform. You can now submit problems and track their progress.",
            type="system"
        )
        db.session.add(notification)
        db.session.commit()
        
        return jsonify({
            "message": "User registered successfully",
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "surname": user.surname,
                "role": user.role
            }
        }), 201
        
    except ValidationError as e:
        return jsonify({"error": "Validation error", "details": e.messages}), 400
    except Exception as e:
        db.session.rollback()
        print("Erreur lors de l'inscription :", e)
        return jsonify({"error": "Registration failed"}), 500

@auth_bp.route('/login/', methods=['POST', 'OPTIONS'])
@limiter.limit("10 per minute")
def login():
    """Login user and return JWT tokens"""
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        schema = LoginSchema()
        data = schema.load(request.json)
        
        # Find user
        user = db.session.query(User).filter_by(email=data['email']).first()
        if not user or not bcrypt.check_password_hash(user.password_hash, data['password']):
            return jsonify({"error": "Invalid credentials"}), 401
        
        if not user.is_active:
            return jsonify({"error": "Account is deactivated"}), 403
        
        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Create tokens
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={
                'email': user.email,
                'role': user.role,
                'name': user.name,
                'surname': user.surname
            }
        )
        refresh_token = create_refresh_token(identity=str(user.id))
        
        return jsonify({
            "message": "Login successful",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "surname": user.surname,
                "role": user.role
            }
        }), 200
        
    except ValidationError as e:
        return jsonify({"error": "Validation error", "details": e.messages}), 400
    except Exception as e:
        print("Erreur lors du login :", e)
        return jsonify({"error": "Login failed"}), 500

@auth_bp.route('/refresh/', methods=['POST', 'OPTIONS'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        current_user_id = get_jwt_identity()
        user = db.session.get(User, current_user_id)
        
        if not user or not user.is_active:
            return jsonify({"error": "Invalid token"}), 401
        
        new_access_token = create_access_token(
            identity=str(user.id),
            additional_claims={
                'email': user.email,
                'role': user.role,
                'name': user.name,
                'surname': user.surname
            }
        )
        
        return jsonify({
            "access_token": new_access_token
        }), 200
        
    except Exception as e:
        return jsonify({"error": "Token refresh failed"}), 500

@auth_bp.route('/logout/', methods=['POST', 'OPTIONS'])
@jwt_required()
def logout():
    """Logout user (client should discard tokens)"""
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        return '', 200
        
    # In a more advanced setup, you could blacklist the token
    return jsonify({"message": "Logout successful"}), 200

@auth_bp.route('/profile/', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_profile():
    """Get current user profile"""
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        current_user_id = get_jwt_identity()
        user = db.session.get(User, current_user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        return jsonify({
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "surname": user.surname,
                "role": user.role,
                "is_active": user.is_active,
                "email_verified": user.email_verified,
                "created_at": user.created_at.isoformat(),
                "last_login": user.last_login.isoformat() if user.last_login else None
            }
        }), 200
        
    except Exception as e:
        return jsonify({"error": "Failed to get profile"}), 500

@auth_bp.route('/change-password/', methods=['POST', 'OPTIONS'])
@jwt_required()
def change_password():
    """Change user password"""
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        schema = ChangePasswordSchema()
        data = schema.load(request.json)
        
        current_user_id = get_jwt_identity()
        user = db.session.get(User, current_user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Verify current password
        if not bcrypt.check_password_hash(user.password_hash, data['current_password']):
            return jsonify({"error": "Current password is incorrect"}), 400
        
        # Validate new password strength
        validate_password_strength(data['new_password'])
        
        # Hash new password
        user.password_hash = bcrypt.generate_password_hash(data['new_password']).decode('utf-8')
        db.session.commit()
        
        return jsonify({"message": "Password changed successfully"}), 200
        
    except ValidationError as e:
        return jsonify({"error": "Validation error", "details": e.messages}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to change password"}), 500

@auth_bp.route('/forgot-password/', methods=['POST', 'OPTIONS'])
@limiter.limit("3 per hour")
def forgot_password():
    """Request password reset"""
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        schema = PasswordResetSchema()
        data = schema.load(request.json)
        
        user = db.session.query(User).filter_by(email=data['email']).first()
        if user:
            # In a real app, you would send an email with reset link
            # For now, we'll just return a success message
            return jsonify({
                "message": "If an account with this email exists, a password reset link has been sent"
            }), 200
        
        # Always return success to prevent email enumeration
        return jsonify({
            "message": "If an account with this email exists, a password reset link has been sent"
        }), 200
        
    except ValidationError as e:
        return jsonify({"error": "Validation error", "details": e.messages}), 400
    except Exception as e:
        return jsonify({"error": "Failed to process request"}), 500 