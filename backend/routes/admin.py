from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from marshmallow import Schema, fields, validate, ValidationError
from sqlalchemy import and_, or_, desc, func, text
from datetime import datetime, timedelta
import json
from extensions import db, cache, mail
from models import (
    User, Problem, ProblemLike, Comment, Notification, Analytics,
    UserRole, ProblemStatus, UrgencyLevel
)
from flask_mail import Message
import logging

admin_bp = Blueprint('admin', __name__)

# Validation schemas
class UserUpdateSchema(Schema):
    is_active = fields.Bool()
    role = fields.Str(validate=validate.OneOf(['student', 'admin', 'moderator']))
    email_verified = fields.Bool()

class BulkUpdateSchema(Schema):
    problem_ids = fields.List(fields.Int(), required=True)
    action = fields.Str(required=True, validate=validate.OneOf(['activate', 'deactivate', 'delete', 'change_status']))
    new_status = fields.Str(validate=validate.OneOf(['Soumis', 'En cours de traitement', 'Problème traité', 'Rejeté', 'Doublon']))

class NotificationCreateSchema(Schema):
    title = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    message = fields.Str(required=True, validate=validate.Length(min=1, max=1000))
    user_ids = fields.List(fields.Int())
    broadcast = fields.Bool(load_default=False)

# Helper functions
def check_admin_permissions():
    """Check if user has admin permissions"""
    claims = get_jwt()
    if claims.get('role') not in ['admin', 'moderator']:
        return False
    return True

def get_user_stats():
    """Get user statistics"""
    total_users = db.session.query(User).count()
    active_users = db.session.query(User).filter_by(is_active=True).count()
    students = db.session.query(User).filter_by(role=UserRole.STUDENT).count()
    admins = db.session.query(User).filter_by(role=UserRole.ADMIN).count()
    moderators = db.session.query(User).filter_by(role=UserRole.MODERATOR).count()
    
    # Users registered this month
    this_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    new_users_this_month = db.session.query(User).filter(User.created_at >= this_month).count()
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "students": students,
        "admins": admins,
        "moderators": moderators,
        "new_users_this_month": new_users_this_month
    }

def get_problem_stats():
    """Get problem statistics"""
    total_problems = db.session.query(Problem).count()
    resolved_problems = db.session.query(Problem).filter_by(state=ProblemStatus.RESOLVED).count()
    in_progress = db.session.query(Problem).filter_by(state=ProblemStatus.IN_PROGRESS).count()
    pending = db.session.query(Problem).filter_by(state=ProblemStatus.SUBMITTED).count()
    
    # Problems by urgency
    high_urgency = db.session.query(Problem).filter_by(urgency=UrgencyLevel.HIGH).count()
    medium_urgency = db.session.query(Problem).filter_by(urgency=UrgencyLevel.MEDIUM).count()
    low_urgency = db.session.query(Problem).filter_by(urgency=UrgencyLevel.LOW).count()
    
    # Problems this month
    this_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    problems_this_month = db.session.query(Problem).filter(Problem.created_at >= this_month).count()
    
    # Average resolution time
    resolved_with_time = db.session.query(Problem).filter(
        and_(
            Problem.state == ProblemStatus.RESOLVED,
            Problem.resolved_at.isnot(None)
        )
    ).all()
    
    total_time = 0
    count = 0
    for problem in resolved_with_time:
        if problem.resolved_at and problem.created_at:
            resolution_time = (problem.resolved_at - problem.created_at).total_seconds() / 3600
            total_time += resolution_time
            count += 1
    
    avg_resolution_time = total_time / count if count > 0 else 0
    
    return {
        "total_problems": total_problems,
        "resolved_problems": resolved_problems,
        "in_progress": in_progress,
        "pending": pending,
        "high_urgency": high_urgency,
        "medium_urgency": medium_urgency,
        "low_urgency": low_urgency,
        "problems_this_month": problems_this_month,
        "resolution_rate": (resolved_problems / total_problems * 100) if total_problems > 0 else 0,
        "avg_resolution_time_hours": round(avg_resolution_time, 2)
    }

# Routes
@admin_bp.route('/dashboard', methods=['GET', 'OPTIONS'])
@jwt_required()
def admin_dashboard():
    """Get admin dashboard data"""
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        if not check_admin_permissions():
            return jsonify({"error": "Insufficient permissions"}), 403
        
        # Get statistics
        user_stats = get_user_stats()
        problem_stats = get_problem_stats()
        
        # Get recent problems
        recent_problems = db.session.query(Problem)\
            .order_by(desc(Problem.created_at))\
            .limit(10)\
            .all()
        
        recent_problems_data = [{
            "id": problem.id,
            "room": problem.room,
            "category": problem.category,
            "urgency": problem.urgency.value,
            "state": problem.state.value,
            "user": {
                "name": problem.user.name,
                "surname": problem.user.surname
            },
            "created_at": problem.created_at.isoformat()
        } for problem in recent_problems]
        
        # Get recent users
        recent_users = db.session.query(User)\
            .order_by(desc(User.created_at))\
            .limit(10)\
            .all()
        
        recent_users_data = [{
            "id": user.id,
            "name": user.name,
            "surname": user.surname,
            "email": user.email,
            "role": user.role.value,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat()
        } for user in recent_users]
        
        # Get unread notifications count
        current_user_id = get_jwt_identity()
        unread_notifications = db.session.query(Notification).filter_by(
            user_id=current_user_id, is_read=False
        ).count()
        
        return jsonify({
            "user_stats": user_stats,
            "problem_stats": problem_stats,
            "recent_problems": recent_problems_data,
            "recent_users": recent_users_data,
            "unread_notifications": unread_notifications
        }), 200
        
    except Exception as e:
        return jsonify({"error": "Failed to fetch dashboard data"}), 500

@admin_bp.route('/users', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_users():
    """Get all users with pagination and filters"""
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        if not check_admin_permissions():
            return jsonify({"error": "Insufficient permissions"}), 403
        
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        search = request.args.get('search', '')
        role = request.args.get('role', '')
        is_active = request.args.get('is_active', type=lambda v: v.lower() == 'true' if v else None)
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')
        
        # Build query
        query = db.session.query(User)
        
        # Apply filters
        if search:
            search_filter = or_(
                User.name.ilike(f'%{search}%'),
                User.surname.ilike(f'%{search}%'),
                User.email.ilike(f'%{search}%')
            )
            query = query.filter(search_filter)
        
        if role:
            query = query.filter(User.role == UserRole(role))
        
        if is_active is not None:
            query = query.filter(User.is_active == is_active)
        
        # Apply sorting
        if sort_by == 'name':
            query = query.order_by(User.name)
        elif sort_by == 'email':
            query = query.order_by(User.email)
        elif sort_by == 'last_login':
            query = query.order_by(desc(User.last_login))
        else:
            query = query.order_by(desc(User.created_at))
        
        # Paginate
        pagination = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        users_data = [{
            "id": user.id,
            "name": user.name,
            "surname": user.surname,
            "email": user.email,
            "role": user.role.value,
            "is_active": user.is_active,
            "email_verified": user.email_verified,
            "created_at": user.created_at.isoformat(),
            "last_login": user.last_login.isoformat() if user.last_login else None,
            "problems_count": len(user.problems)
        } for user in pagination.items]
        
        return jsonify({
            "users": users_data,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": pagination.total,
                "pages": pagination.pages,
                "has_next": pagination.has_next,
                "has_prev": pagination.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({"error": "Failed to fetch users"}), 500

@admin_bp.route('/users/<int:user_id>', methods=['PUT', 'OPTIONS'])
@jwt_required()
def update_user(user_id):
    """Update user (admin only)"""
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        if not check_admin_permissions():
            return jsonify({"error": "Insufficient permissions"}), 403
        
        schema = UserUpdateSchema()
        data = schema.load(request.json)
        
        user = db.session.get(User, user_id)
        
        # Update fields
        if 'is_active' in data:
            user.is_active = data['is_active']
        
        if 'role' in data:
            user.role = UserRole(data['role'])
        
        if 'email_verified' in data:
            user.email_verified = data['email_verified']
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            "message": "User updated successfully",
            "user": {
                "id": user.id,
                "name": user.name,
                "surname": user.surname,
                "email": user.email,
                "role": user.role.value,
                "is_active": user.is_active,
                "email_verified": user.email_verified
            }
        }), 200
        
    except ValidationError as e:
        return jsonify({"error": "Validation error", "details": e.messages}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to update user"}), 500

@admin_bp.route('/problems/bulk-update', methods=['POST', 'OPTIONS'])
@jwt_required()
def bulk_update_problems():
    """Bulk update problems (admin only)"""
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        if not check_admin_permissions():
            return jsonify({"error": "Insufficient permissions"}), 403
        
        schema = BulkUpdateSchema()
        data = schema.load(request.json)
        
        problems = db.session.query(Problem).filter(Problem.id.in_(data['problem_ids'])).all()
        
        if not problems:
            return jsonify({"error": "No problems found"}), 404
        
        updated_count = 0
        
        for problem in problems:
            if data['action'] == 'activate':
                problem.state = ProblemStatus.SUBMITTED
            elif data['action'] == 'deactivate':
                problem.state = ProblemStatus.REJECTED
            elif data['action'] == 'delete':
                db.session.delete(problem)
            elif data['action'] == 'change_status' and 'new_status' in data:
                problem.state = ProblemStatus(data['new_status'])
                if data['new_status'] == 'Problème traité':
                    problem.resolved_at = datetime.utcnow()
            
            updated_count += 1
        
        db.session.commit()
        
        return jsonify({
            "message": f"Successfully updated {updated_count} problems",
            "updated_count": updated_count
        }), 200
        
    except ValidationError as e:
        return jsonify({"error": "Validation error", "details": e.messages}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to bulk update problems"}), 500

@admin_bp.route('/analytics', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_analytics():
    """Get detailed analytics"""
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        if not check_admin_permissions():
            return jsonify({"error": "Insufficient permissions"}), 403
        
        # Get date range
        days = request.args.get('days', 30, type=int)
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Problems over time
        problems_over_time = db.session.query(
            func.date(Problem.created_at).label('date'),
            func.count(Problem.id).label('count')
        ).filter(
            Problem.created_at >= start_date
        ).group_by(
            func.date(Problem.created_at)
        ).order_by(
            func.date(Problem.created_at)
        ).all()
        
        # Problems by category
        problems_by_category = db.session.query(
            Problem.category,
            func.count(Problem.id).label('count')
        ).group_by(Problem.category).order_by(
            func.count(Problem.id).desc()
        ).all()
        
        # Problems by urgency
        problems_by_urgency = db.session.query(
            Problem.urgency,
            func.count(Problem.id).label('count')
        ).group_by(Problem.urgency).all()
        
        # Resolution time distribution
        resolved_problems = db.session.query(Problem).filter(
            and_(
                Problem.state == ProblemStatus.RESOLVED,
                Problem.resolved_at.isnot(None),
                Problem.created_at >= start_date
            )
        ).all()
        
        resolution_times = []
        for problem in resolved_problems:
            if problem.resolved_at and problem.created_at:
                hours = (problem.resolved_at - problem.created_at).total_seconds() / 3600
                resolution_times.append(hours)
        
        # User activity
        active_users = db.session.query(
            func.date(User.last_login).label('date'),
            func.count(User.id).label('count')
        ).filter(
            and_(
                User.last_login >= start_date,
                User.last_login.isnot(None)
            )
        ).group_by(
            func.date(User.last_login)
        ).order_by(
            func.date(User.last_login)
        ).all()
        
        return jsonify({
            "problems_over_time": [
                {"date": str(item.date), "count": item.count}
                for item in problems_over_time
            ],
            "problems_by_category": [
                {"category": item.category, "count": item.count}
                for item in problems_by_category
            ],
            "problems_by_urgency": [
                {"urgency": item.urgency.value, "count": item.count}
                for item in problems_by_urgency
            ],
            "resolution_times": resolution_times,
            "active_users": [
                {"date": str(item.date), "count": item.count}
                for item in active_users
            ],
            "summary": {
                "total_problems": len(resolved_problems),
                "avg_resolution_time": sum(resolution_times) / len(resolution_times) if resolution_times else 0,
                "total_categories": len(problems_by_category)
            }
        }), 200
        
    except Exception as e:
        return jsonify({"error": "Failed to fetch analytics"}), 500

@admin_bp.route('/notifications', methods=['POST'])
@jwt_required()
def create_notification():
    """Create notification (admin only)"""
    try:
        if not check_admin_permissions():
            return jsonify({"error": "Insufficient permissions"}), 403
        
        schema = NotificationCreateSchema()
        data = schema.load(request.json)
        
        notifications_created = 0
        
        if data.get('broadcast', False):
            # Send to all users
            users = db.session.query(User).filter_by(is_active=True).all()
            for user in users:
                notification = Notification(
                    user_id=user.id,
                    title=data['title'],
                    message=data['message'],
                    type="system"
                )
                db.session.add(notification)
                notifications_created += 1
        else:
            # Send to specific users
            if not data.get('user_ids'):
                return jsonify({"error": "User IDs required when not broadcasting"}), 400
            
            for user_id in data['user_ids']:
                user = db.session.get(User, user_id)
                if user:
                    notification = Notification(
                        user_id=user_id,
                        title=data['title'],
                        message=data['message'],
                        type="system"
                    )
                    db.session.add(notification)
                    notifications_created += 1
        
        db.session.commit()
        
        return jsonify({
            "message": f"Notification sent to {notifications_created} users",
            "notifications_created": notifications_created
        }), 201
        
    except ValidationError as e:
        return jsonify({"error": "Validation error", "details": e.messages}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to create notification"}), 500

@admin_bp.route('/system/health', methods=['GET', 'OPTIONS'])
@jwt_required()
def system_health():
    """Get system health information"""
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        if not check_admin_permissions():
            return jsonify({"error": "Insufficient permissions"}), 403
        
        # Database health
        try:
            db.session.execute(text('SELECT 1'))
            db_status = "healthy"
        except Exception:
            db_status = "unhealthy"
        
        # Cache health
        try:
            cache.set('health_check', 'ok', timeout=60)
            cache_status = "healthy" if cache.get('health_check') == 'ok' else "unhealthy"
        except Exception:
            cache_status = "unhealthy"
        
        # Get system stats
        total_users = db.session.query(User).count()
        total_problems = db.session.query(Problem).count()
        total_notifications = db.session.query(Notification).count()
        
        return jsonify({
            "status": "healthy",
            "services": {
                "database": db_status,
                "cache": cache_status
            },
            "stats": {
                "total_users": total_users,
                "total_problems": total_problems,
                "total_notifications": total_notifications
            },
            "timestamp": datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }), 500 