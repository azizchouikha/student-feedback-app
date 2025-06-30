from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import Schema, fields, validate, ValidationError
from sqlalchemy import desc
from datetime import datetime
from extensions import db, cache
from models import Notification, User

notifications_bp = Blueprint('notifications', __name__)

# Validation schemas
class NotificationSettingsSchema(Schema):
    email_notifications = fields.Bool(load_default=True)
    push_notifications = fields.Bool(load_default=True)
    problem_updates = fields.Bool(load_default=True)
    comments = fields.Bool(load_default=True)
    system_notifications = fields.Bool(load_default=True)

# Routes
@notifications_bp.route('/', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_notifications():
    """Get user notifications with pagination"""
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        current_user_id = get_jwt_identity()
        
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        notification_type = request.args.get('type', '')
        
        # Build query
        query = db.session.query(Notification).filter_by(user_id=current_user_id)
        
        # Apply filters
        if unread_only:
            query = query.filter_by(is_read=False)
        
        if notification_type:
            query = query.filter_by(type=notification_type)
        
        # Order by creation date (newest first)
        query = query.order_by(desc(Notification.created_at))
        
        # Paginate
        pagination = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        notifications_data = [{
            "id": notification.id,
            "title": notification.title,
            "message": notification.message,
            "type": notification.type,
            "is_read": notification.is_read,
            "data": notification.data,
            "created_at": notification.created_at.isoformat()
        } for notification in pagination.items]
        
        return jsonify({
            "notifications": notifications_data,
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
        return jsonify({"error": "Failed to fetch notifications"}), 500

@notifications_bp.route('/<int:notification_id>/read', methods=['POST', 'OPTIONS'])
@jwt_required()
def mark_as_read(notification_id):
    """Mark a notification as read"""
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        current_user_id = get_jwt_identity()
        
        notification = db.session.query(Notification).filter_by(
            id=notification_id, user_id=current_user_id
        ).first()
        
        if not notification:
            return jsonify({"error": "Notification not found"}), 404
        
        notification.is_read = True
        db.session.commit()
        
        return jsonify({
            "message": "Notification marked as read",
            "notification": {
                "id": notification.id,
                "is_read": notification.is_read
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to mark notification as read"}), 500

@notifications_bp.route('/read-all', methods=['POST', 'OPTIONS'])
@jwt_required()
def mark_all_as_read():
    """Mark all user notifications as read"""
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        current_user_id = get_jwt_identity()
        
        # Update all unread notifications for the user
        updated_count = db.session.query(Notification).filter_by(
            user_id=current_user_id, is_read=False
        ).update({"is_read": True})
        
        db.session.commit()
        
        return jsonify({
            "message": f"Marked {updated_count} notifications as read",
            "updated_count": updated_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to mark notifications as read"}), 500

@notifications_bp.route('/<int:notification_id>', methods=['DELETE', 'OPTIONS'])
@jwt_required()
def delete_notification(notification_id):
    """Delete a notification"""
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        current_user_id = get_jwt_identity()
        
        notification = db.session.query(Notification).filter_by(
            id=notification_id, user_id=current_user_id
        ).first()
        
        if not notification:
            return jsonify({"error": "Notification not found"}), 404
        
        db.session.delete(notification)
        db.session.commit()
        
        return jsonify({
            "message": "Notification deleted successfully"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to delete notification"}), 500

@notifications_bp.route('/clear-all', methods=['DELETE', 'OPTIONS'])
@jwt_required()
def clear_all_notifications():
    """Clear all user notifications"""
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        current_user_id = get_jwt_identity()
        
        # Delete all notifications for the user
        deleted_count = db.session.query(Notification).filter_by(user_id=current_user_id).delete()
        
        db.session.commit()
        
        return jsonify({
            "message": f"Cleared {deleted_count} notifications",
            "deleted_count": deleted_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to clear notifications"}), 500

@notifications_bp.route('/unread-count', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_unread_count():
    """Get count of unread notifications"""
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        current_user_id = get_jwt_identity()
        
        unread_count = db.session.query(Notification).filter_by(
            user_id=current_user_id, is_read=False
        ).count()
        
        return jsonify({
            "unread_count": unread_count
        }), 200
        
    except Exception as e:
        return jsonify({"error": "Failed to get unread count"}), 500

@notifications_bp.route('/settings', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_notification_settings():
    """Get user notification settings"""
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        current_user_id = get_jwt_identity()
        user = db.session.get(User, current_user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # For now, return default settings
        # In a real app, you would store these in the database
        settings = {
            "email_notifications": True,
            "push_notifications": True,
            "problem_updates": True,
            "comments": True,
            "system_notifications": True
        }
        
        return jsonify({
            "settings": settings
        }), 200
        
    except Exception as e:
        return jsonify({"error": "Failed to get notification settings"}), 500

@notifications_bp.route('/settings', methods=['PUT', 'OPTIONS'])
@jwt_required()
def update_notification_settings():
    """Update user notification settings"""
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        current_user_id = get_jwt_identity()
        user = db.session.get(User, current_user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        schema = NotificationSettingsSchema()
        data = schema.load(request.json)
        
        # In a real app, you would save these settings to the database
        # For now, we'll just return the updated settings
        
        return jsonify({
            "message": "Notification settings updated successfully",
            "settings": data
        }), 200
        
    except ValidationError as e:
        return jsonify({"error": "Validation error", "details": e.messages}), 400
    except Exception as e:
        return jsonify({"error": "Failed to update notification settings"}), 500

@notifications_bp.route('/types', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_notification_types():
    """Get available notification types"""
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        # Get unique notification types for the current user
        current_user_id = get_jwt_identity()
        
        types = db.session.query(Notification.type)\
            .filter_by(user_id=current_user_id)\
            .distinct()\
            .all()
        
        notification_types = [notification_type[0] for notification_type in types]
        
        return jsonify({
            "types": notification_types
        }), 200
        
    except Exception as e:
        return jsonify({"error": "Failed to get notification types"}), 500 