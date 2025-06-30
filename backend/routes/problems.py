from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from marshmallow import Schema, fields, validate, ValidationError
from sqlalchemy import and_, or_, desc, func
from datetime import datetime, timedelta
import os
import uuid
from werkzeug.utils import secure_filename
from extensions import db, cache, mail
from models import (
    User, Problem, ProblemLike, Comment, Attachment, ProblemHistory, 
    Notification, ProblemStatus, UrgencyLevel, UserRole
)
from flask_mail import Message
import json

problems_bp = Blueprint('problems', __name__)

# Validation schemas
class ProblemCreateSchema(Schema):
    promotion = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    room = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    category = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    type_of_problem = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    description = fields.Str(required=True, validate=validate.Length(min=10, max=2000))
    other = fields.Str(validate=validate.Length(max=500))
    urgency = fields.Int(required=True, validate=validate.OneOf([1, 2, 3]))
    remark = fields.Str(required=True, validate=validate.Length(min=1, max=1000))
    tags = fields.List(fields.Str(), validate=validate.Length(max=10))
    location_coordinates = fields.Dict()

class ProblemUpdateSchema(Schema):
    state = fields.Str(validate=validate.OneOf(['Soumis', 'En cours de traitement', 'Problème traité', 'Rejeté', 'Doublon']))
    message = fields.Str(validate=validate.Length(max=1000))
    estimated_resolution_time = fields.Int(validate=validate.Range(min=1, max=720))  # Max 30 days
    assigned_to = fields.Int()

class CommentSchema(Schema):
    content = fields.Str(required=True, validate=validate.Length(min=1, max=1000))
    is_internal = fields.Bool(load_default=False)

# Helper functions
def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

def save_attachment(file, problem_id):
    """Save uploaded file"""
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], unique_filename)
        
        # Ensure upload directory exists
        os.makedirs(current_app.config['UPLOAD_FOLDER'], exist_ok=True)
        
        file.save(file_path)
        
        attachment = Attachment(
            problem_id=problem_id,
            filename=unique_filename,
            original_filename=filename,
            file_path=file_path,
            file_size=os.path.getsize(file_path),
            mime_type=file.content_type
        )
        
        db.session.add(attachment)
        return attachment
    return None

def create_problem_history(problem_id, user_id, action, old_value=None, new_value=None):
    """Create problem history entry"""
    history = ProblemHistory(
        problem_id=problem_id,
        user_id=user_id,
        action=action,
        old_value=old_value,
        new_value=new_value
    )
    db.session.add(history)

def calculate_priority_score(urgency, likes_count, created_at):
    """Calculate priority score for problem"""
    # Base score from urgency
    base_score = urgency * 10
    
    # Bonus for likes
    like_bonus = likes_count * 2
    
    # Time decay (newer problems get higher score)
    time_diff = datetime.utcnow() - created_at
    time_bonus = max(0, 50 - (time_diff.days * 2))
    
    return base_score + like_bonus + time_bonus

def send_email_notification(recipient_email, subject, body, html_body=None):
    """Send email notification using Flask-Mail"""
    try:
        # Check if email sending is suppressed (development mode)
        if current_app.config.get('MAIL_SUPPRESS_SEND', True):
            print(f"[EMAIL SUPPRESSED] Would send to {recipient_email}: {subject}")
            return True
        
        # Check if mail configuration is complete
        if not current_app.config.get('MAIL_USERNAME') or not current_app.config.get('MAIL_PASSWORD'):
            print(f"[EMAIL ERROR] Mail configuration incomplete. Would send to {recipient_email}: {subject}")
            return False
        
        msg = Message(
            subject=subject,
            recipients=[recipient_email],
            body=body,
            html=html_body
        )
        mail.send(msg)
        print(f"[EMAIL SENT] Successfully sent to {recipient_email}: {subject}")
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send email to {recipient_email}: {e}")
        # Don't raise the exception to avoid blocking the application
        return False

def send_status_change_email(problem, new_state, admin_message=None):
    """Send email to student when problem status changes"""
    try:
        student = problem.user
        urgency_text = {1: "Faible", 2: "Moyenne", 3: "Élevée"}[problem.urgency]
        
        subject = f"Statut mis à jour - Problème {problem.id} ({problem.room})"
        
        body = f"""
Bonjour {student.name} {student.surname},

Le statut de votre problème a été mis à jour.

Détails du problème :
- ID: {problem.id}
- Salle: {problem.room}
- Catégorie: {problem.category}
- Type: {problem.type_of_problem}
- Urgence: {urgency_text}
- Nouveau statut: {new_state}

Description: {problem.description}

{admin_message if admin_message else ""}

Cordialement,
L'équipe EasyReport
        """.strip()
        
        html_body = f"""
        <html>
        <body>
            <h2>Statut mis à jour - Problème {problem.id}</h2>
            <p>Bonjour {student.name} {student.surname},</p>
            <p>Le statut de votre problème a été mis à jour.</p>
            
            <h3>Détails du problème :</h3>
            <ul>
                <li><strong>ID:</strong> {problem.id}</li>
                <li><strong>Salle:</strong> {problem.room}</li>
                <li><strong>Catégorie:</strong> {problem.category}</li>
                <li><strong>Type:</strong> {problem.type_of_problem}</li>
                <li><strong>Urgence:</strong> {urgency_text}</li>
                <li><strong>Nouveau statut:</strong> <span style="color: {'green' if new_state == 'Problème traité' else 'orange'}">{new_state}</span></li>
            </ul>
            
            <p><strong>Description:</strong> {problem.description}</p>
            
            {f'<p><strong>Message de l\'administrateur:</strong> {admin_message}</p>' if admin_message else ''}
            
            <p>Cordialement,<br>L'équipe EasyReport</p>
        </body>
        </html>
        """
        
        return send_email_notification(student.email, subject, body, html_body)
    except Exception as e:
        print(f"Error sending status change email: {e}")
        return False

def send_problem_resolved_email(problem, admin_message=None):
    """Send email to student when problem is resolved"""
    try:
        student = problem.user
        resolution_time = ""
        if problem.resolved_at and problem.created_at:
            duration = problem.resolved_at - problem.created_at
            hours = int(duration.total_seconds() // 3600)
            minutes = int((duration.total_seconds() % 3600) // 60)
            resolution_time = f"{hours}h {minutes}m"
        
        subject = f"Problème résolu - Problème {problem.id} ({problem.room})"
        
        body = f"""
Bonjour {student.name} {student.surname},

Votre problème a été résolu avec succès !

Détails du problème :
- ID: {problem.id}
- Salle: {problem.room}
- Catégorie: {problem.category}
- Type: {problem.type_of_problem}
- Temps de résolution: {resolution_time}

Description: {problem.description}

{admin_message if admin_message else ""}

Merci d'avoir utilisé EasyReport !

Cordialement,
L'équipe EasyReport
        """.strip()
        
        html_body = f"""
        <html>
        <body>
            <h2 style="color: green;">✅ Problème résolu - Problème {problem.id}</h2>
            <p>Bonjour {student.name} {student.surname},</p>
            <p>Votre problème a été <strong>résolu avec succès</strong> !</p>
            
            <h3>Détails du problème :</h3>
            <ul>
                <li><strong>ID:</strong> {problem.id}</li>
                <li><strong>Salle:</strong> {problem.room}</li>
                <li><strong>Catégorie:</strong> {problem.category}</li>
                <li><strong>Type:</strong> {problem.type_of_problem}</li>
                <li><strong>Temps de résolution:</strong> {resolution_time}</li>
            </ul>
            
            <p><strong>Description:</strong> {problem.description}</p>
            
            {f'<p><strong>Message de l\'administrateur:</strong> {admin_message}</p>' if admin_message else ''}
            
            <p>Merci d'avoir utilisé EasyReport !</p>
            <p>Cordialement,<br>L'équipe EasyReport</p>
        </body>
        </html>
        """
        
        return send_email_notification(student.email, subject, body, html_body)
    except Exception as e:
        print(f"Error sending problem resolved email: {e}")
        return False

def send_new_problem_admin_email(problem):
    """Send email to all admins when a new problem is submitted"""
    try:
        admins = db.session.query(User).filter_by(role='admin').all()
        if not admins:
            return False
        
        student = problem.user
        urgency_text = {1: "Faible", 2: "Moyenne", 3: "Élevée"}[problem.urgency]
        urgency_color = {1: "green", 2: "orange", 3: "red"}[problem.urgency]
        
        subject = f"🚨 Nouveau problème signalé - {problem.room} (Urgence: {urgency_text})"
        
        body = f"""
Nouveau problème signalé !

Détails du problème :
- ID: {problem.id}
- Étudiant: {student.name} {student.surname} ({student.email})
- Salle: {problem.room}
- Promotion: {problem.promotion}
- Catégorie: {problem.category}
- Type: {problem.type_of_problem}
- Urgence: {urgency_text}
- Date: {problem.created_at.strftime('%d/%m/%Y à %H:%M')}

Description: {problem.description}

Remarque: {problem.remark}

Connectez-vous à l'interface d'administration pour traiter ce problème.

Cordialement,
Système EasyReport
        """.strip()
        
        html_body = f"""
        <html>
        <body>
            <h2 style="color: red;">🚨 Nouveau problème signalé</h2>
            
            <h3>Détails du problème :</h3>
            <ul>
                <li><strong>ID:</strong> {problem.id}</li>
                <li><strong>Étudiant:</strong> {student.name} {student.surname} ({student.email})</li>
                <li><strong>Salle:</strong> {problem.room}</li>
                <li><strong>Promotion:</strong> {problem.promotion}</li>
                <li><strong>Catégorie:</strong> {problem.category}</li>
                <li><strong>Type:</strong> {problem.type_of_problem}</li>
                <li><strong>Urgence:</strong> <span style="color: {urgency_color}">{urgency_text}</span></li>
                <li><strong>Date:</strong> {problem.created_at.strftime('%d/%m/%Y à %H:%M')}</li>
            </ul>
            
            <p><strong>Description:</strong> {problem.description}</p>
            <p><strong>Remarque:</strong> {problem.remark}</p>
            
            <p><a href="{current_app.config.get('FRONTEND_URL', 'http://localhost:3000')}/admin" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Accéder à l'administration</a></p>
            
            <p>Cordialement,<br>Système EasyReport</p>
        </body>
        </html>
        """
        
        # Send to all admins
        success_count = 0
        for admin in admins:
            if send_email_notification(admin.email, subject, body, html_body):
                success_count += 1
        
        return success_count > 0
    except Exception as e:
        print(f"Error sending new problem admin email: {e}")
        return False

# Routes
@problems_bp.route('/', methods=['POST', 'OPTIONS'])
@jwt_required()
def create_problem():
    """Create a new problem"""
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        # Check if user is student
        claims = get_jwt()
        if claims.get('role') != 'student':
            return jsonify({"error": "Only students can submit problems"}), 403
        
        schema = ProblemCreateSchema()
        
        # Accepte JSON ou multipart/form-data
        if request.is_json:
            data = schema.load(request.get_json())
        else:
            data = schema.load(request.form)
        
        current_user_id = get_jwt_identity()
        
        # Check for duplicate problem (same room, category, same day)
        existing_problem = db.session.query(Problem).filter(
            and_(
                Problem.user_id == current_user_id,
                Problem.room == data['room'],
                Problem.category == data['category'],
                func.date(Problem.created_at) == func.date(func.now())
            )
        ).first()
        
        if existing_problem:
            return jsonify({
                "error": "A problem in the same room and category has already been submitted today"
            }), 400
        
        # Create problem
        problem = Problem(
            user_id=current_user_id,
            promotion=data['promotion'],
            room=data['room'],
            category=data['category'],
            type_of_problem=data['type_of_problem'],
            description=data['description'],
            other=data.get('other'),
            urgency=data['urgency'],  # Use integer directly
            remark=data['remark'],
            tags=json.dumps(data.get('tags', [])) if data.get('tags') else None,  # Convert to JSON string
            location_coordinates=json.dumps(data.get('location_coordinates')) if data.get('location_coordinates') else None
        )
        
        db.session.add(problem)
        db.session.flush()  # Get the ID
        
        # Handle file uploads
        if 'files' in request.files:
            files = request.files.getlist('files')
            for file in files:
                if file.filename:
                    attachment = save_attachment(file, problem.id)
        
        # Calculate priority score
        problem.priority_score = calculate_priority_score(
            problem.urgency, 0, problem.created_at
        )
        
        db.session.commit()
        
        # Create history entry
        create_problem_history(problem.id, current_user_id, 'problem_created')
        
        # Notify admins
        admins = db.session.query(User).filter_by(role='admin').all()
        for admin in admins:
            notification = Notification(
                user_id=admin.id,
                title="New Problem Submitted",
                message=f"A new problem has been submitted in {problem.room}",
                type="problem_update",
                data=json.dumps({"problem_id": problem.id})
            )
            db.session.add(notification)
        
        db.session.commit()
        
        # Send email notification to admins
        send_new_problem_admin_email(problem)
        
        return jsonify({
            "message": "Problem submitted successfully",
            "problem": {
                "id": problem.id,
                "room": problem.room,
                "category": problem.category,
                "urgency": problem.urgency,
                "state": problem.state,
                "created_at": problem.created_at.isoformat()
            }
        }), 201
        
    except ValidationError as e:
        return jsonify({"error": "Validation error", "details": e.messages}), 400
    except Exception as e:
        db.session.rollback()
        import traceback; traceback.print_exc()
        print('Erreur soumission problème:', e)
        return jsonify({"error": "Failed to submit problem", "details": str(e)}), 500

@problems_bp.route('/', methods=['GET', 'OPTIONS'])
@jwt_required(optional=True)  # Make JWT optional for OPTIONS requests
@cache.cached(timeout=300)  # Cache for 5 minutes
def get_problems():
    """Get problems with pagination, search, and filters"""
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        search = request.args.get('search', '')
        category = request.args.get('category', '')
        urgency = request.args.get('urgency', type=int)
        status = request.args.get('status', '')
        room = request.args.get('room', '')
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')
        
        # Get current user info
        current_user_id = get_jwt_identity()
        claims = get_jwt() if current_user_id else {}
        user_role = claims.get('role') if claims else None
        
        # Build query
        query = db.session.query(Problem)
        
        # Filter by user role for confidentiality
        if user_role == 'student':
            # Students can only see their own problems
            query = query.filter(Problem.user_id == current_user_id)
        elif user_role == 'admin':
            # Admins can see all problems
            pass
        else:
            # Unauthenticated users or other roles - no access
            return jsonify({"error": "Authentication required"}), 401
        
        # Apply filters
        if search:
            search_filter = or_(
                Problem.description.ilike(f'%{search}%'),
                Problem.type_of_problem.ilike(f'%{search}%'),
                Problem.room.ilike(f'%{search}%')
            )
            query = query.filter(search_filter)
        
        if category:
            query = query.filter(Problem.category == category)
        
        if urgency:
            query = query.filter(Problem.urgency == urgency)
        
        if status:
            query = query.filter(Problem.state == status)
        
        if room:
            query = query.filter(Problem.room.ilike(f'%{room}%'))
        
        # Apply sorting
        if sort_by == 'priority':
            query = query.order_by(desc(Problem.priority_score))
        elif sort_by == 'urgency':
            query = query.order_by(desc(Problem.urgency))
        elif sort_by == 'likes':
            query = query.order_by(desc(Problem.likes_count))
        else:
            query = query.order_by(desc(Problem.created_at))
        
        # Paginate
        pagination = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        # Check if user liked each problem
        problems_data = []
        
        for problem in pagination.items:
            # For students, don't show other users' names for confidentiality
            user_info = {}
            if user_role == 'admin':
                user_info = {
                    "name": problem.user.name,
                    "surname": problem.user.surname
                }
            elif user_role == 'student' and problem.user_id == current_user_id:
                user_info = {
                    "name": problem.user.name,
                    "surname": problem.user.surname
                }
            else:
                # Hide user info for confidentiality
                user_info = {
                    "name": "Anonyme",
                    "surname": ""
                }
            
            problem_dict = {
                "id": problem.id,
                "user": user_info,
                "promotion": problem.promotion,
                "room": problem.room,
                "category": problem.category,
                "type_of_problem": problem.type_of_problem,
                "description": problem.description,
                "other": problem.other,
                "urgency": problem.urgency,
                "remark": problem.remark,
                "state": problem.state,
                "message": problem.message,
                "likes_count": problem.likes_count,
                "views_count": problem.views_count,
                "priority_score": problem.priority_score,
                "tags": json.loads(problem.tags) if problem.tags else [],
                "created_at": problem.created_at.isoformat(),
                "updated_at": problem.updated_at.isoformat(),
                "is_liked": db.session.query(ProblemLike).filter_by(
                    user_id=current_user_id, problem_id=problem.id
                ).first() is not None if current_user_id else False
            }
            problems_data.append(problem_dict)
        
        return jsonify({
            "problems": problems_data,
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
        return jsonify({"error": "Failed to fetch problems"}), 500

@problems_bp.route('/<int:problem_id>', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_problem(problem_id):
    """Get a specific problem with details"""
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        problem = db.session.get(Problem, problem_id)
        
        # Increment view count
        problem.views_count += 1
        db.session.commit()
        
        # Get comments
        comments = db.session.query(Comment).filter_by(problem_id=problem_id).order_by(Comment.created_at).all()
        comments_data = []
        
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        
        for comment in comments:
            # Hide internal comments from students
            if comment.is_internal and claims.get('role') == 'student':
                continue
                
            comments_data.append({
                "id": comment.id,
                "user": {
                    "name": comment.user.name,
                    "surname": comment.user.surname,
                    "role": comment.user.role
                },
                "content": comment.content,
                "is_internal": comment.is_internal,
                "created_at": comment.created_at.isoformat()
            })
        
        # Get attachments
        attachments = db.session.query(Attachment).filter_by(problem_id=problem_id).all()
        attachments_data = [{
            "id": att.id,
            "filename": att.original_filename,
            "file_size": att.file_size,
            "mime_type": att.mime_type,
            "uploaded_at": att.uploaded_at.isoformat()
        } for att in attachments]
        
        # Check if user liked
        current_user_id = get_jwt_identity()
        is_liked = db.session.query(ProblemLike).filter_by(
            user_id=current_user_id, problem_id=problem_id
        ).first() is not None
        
        problem_data = {
            "id": problem.id,
            "user": {
                "name": problem.user.name,
                "surname": problem.user.surname,
                "role": problem.user.role
            },
            "promotion": problem.promotion,
            "room": problem.room,
            "category": problem.category,
            "type_of_problem": problem.type_of_problem,
            "description": problem.description,
            "other": problem.other,
            "urgency": problem.urgency,
            "remark": problem.remark,
            "state": problem.state,
            "message": problem.message,
            "likes_count": problem.likes_count,
            "views_count": problem.views_count,
            "priority_score": problem.priority_score,
            "estimated_resolution_time": problem.estimated_resolution_time,
            "assigned_to": problem.assigned_to,
            "tags": json.loads(problem.tags) if problem.tags else [],
            "location_coordinates": json.loads(problem.location_coordinates) if problem.location_coordinates else None,
            "created_at": problem.created_at.isoformat(),
            "updated_at": problem.updated_at.isoformat(),
            "resolved_at": problem.resolved_at.isoformat() if problem.resolved_at else None,
            "is_liked": is_liked,
            "comments": comments_data,
            "attachments": attachments_data
        }
        
        return jsonify({"problem": problem_data}), 200
        
    except Exception as e:
        return jsonify({"error": "Failed to fetch problem"}), 500

@problems_bp.route('/<int:problem_id>/like', methods=['POST', 'OPTIONS'])
@jwt_required(optional=True)
def toggle_like(problem_id):
    """Toggle like on a problem"""
    if request.method == 'OPTIONS':
        print(f'OPTIONS preflight received for /api/problems/{problem_id}/like')
        return '', 200
        
    try:
        current_user_id = get_jwt_identity()
        
        # Check if problem exists
        problem = db.session.get(Problem, problem_id)
        
        # Check if already liked
        existing_like = db.session.query(ProblemLike).filter_by(
            user_id=current_user_id, problem_id=problem_id
        ).first()
        
        if existing_like:
            # Unlike
            db.session.delete(existing_like)
            problem.likes_count -= 1
            action = "unliked"
        else:
            # Like
            like = ProblemLike(user_id=current_user_id, problem_id=problem_id)
            db.session.add(like)
            problem.likes_count += 1
            action = "liked"
        
        # Recalculate priority score
        problem.priority_score = calculate_priority_score(
            problem.urgency, problem.likes_count, problem.created_at
        )
        
        # Create history entry
        create_problem_history(problem_id, current_user_id, f'problem_{action}')
        
        db.session.commit()
        
        return jsonify({
            "message": f"Problem {action} successfully",
            "likes_count": problem.likes_count,
            "is_liked": action == "liked"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to toggle like"}), 500

@problems_bp.route('/<int:problem_id>/like/', methods=['OPTIONS'])
def like_options_slash(problem_id):
    print(f'OPTIONS explicit route for /api/problems/{problem_id}/like/ (slash)')
    return '', 200

@problems_bp.route('/<int:problem_id>/like/', methods=['POST'])
@jwt_required(optional=True)
def toggle_like_slash(problem_id):
    return toggle_like(problem_id)

@problems_bp.route('/<int:problem_id>/comments', methods=['POST', 'OPTIONS'])
@jwt_required()
def add_comment(problem_id):
    """Add a comment to a problem"""
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        schema = CommentSchema()
        data = schema.load(request.json)
        
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        
        # Check if problem exists
        problem = db.session.get(Problem, problem_id)
        
        # Only admins can add internal comments
        if data.get('is_internal', False) and claims.get('role') != 'admin':
            return jsonify({"error": "Only admins can add internal comments"}), 403
        
        comment = Comment(
            user_id=current_user_id,
            problem_id=problem_id,
            content=data['content'],
            is_internal=data.get('is_internal', False)
        )
        
        db.session.add(comment)
        
        # Create history entry
        create_problem_history(problem_id, current_user_id, 'comment_added')
        
        # Notify problem owner if comment is not internal
        if not data.get('is_internal', False) and problem.user_id != current_user_id:
            notification = Notification(
                user_id=problem.user_id,
                title="New Comment on Your Problem",
                message=f"Someone commented on your problem in {problem.room}",
                type="comment",
                data=json.dumps({"problem_id": problem_id, "comment_id": comment.id})
            )
            db.session.add(notification)
        
        db.session.commit()
        
        return jsonify({
            "message": "Comment added successfully",
            "comment": {
                "id": comment.id,
                "content": comment.content,
                "is_internal": comment.is_internal,
                "created_at": comment.created_at.isoformat()
            }
        }), 201
        
    except ValidationError as e:
        return jsonify({"error": "Validation error", "details": e.messages}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to add comment"}), 500

@problems_bp.route('/<int:problem_id>', methods=['PUT', 'OPTIONS'])
@problems_bp.route('/<int:problem_id>/', methods=['PUT', 'OPTIONS'])
@jwt_required()
def update_problem(problem_id):
    """Update a problem (admin only)"""
    if request.method == 'OPTIONS':
        return '', 200
    try:
        claims = get_jwt()
        if claims.get('role') not in ['admin', 'moderator']:
            return jsonify({"error": "Insufficient permissions"}), 403
        
        schema = ProblemUpdateSchema()
        data = schema.load(request.json)
        
        problem = db.session.get(Problem, problem_id)
        
        # Track changes for history
        changes = {}
        
        if 'state' in data and data['state'] != problem.state:
            old_state = problem.state
            problem.state = data['state']
            changes['state'] = {'old': old_state, 'new': data['state']}
            
            # Set resolved_at if problem is resolved
            if data['state'] == 'Problème traité':
                problem.resolved_at = datetime.utcnow()
        
        if 'message' in data:
            problem.message = data['message']
            changes['message'] = {'old': problem.message, 'new': data['message']}
        
        if 'estimated_resolution_time' in data:
            problem.estimated_resolution_time = data['estimated_resolution_time']
        
        if 'assigned_to' in data:
            problem.assigned_to = data['assigned_to']
        
        problem.updated_at = datetime.utcnow()
        
        # Create history entries
        current_user_id = get_jwt_identity()
        for field, change in changes.items():
            create_problem_history(
                problem_id, current_user_id, f'{field}_updated',
                str(change['old']), str(change['new'])
            )
        
        # Notify problem owner of status change
        if 'state' in changes:
            notification = Notification(
                user_id=problem.user_id,
                title="Problem Status Updated",
                message=f"Your problem in {problem.room} has been updated to: {data['state']}",
                type="problem_update",
                data=json.dumps({"problem_id": problem_id, "new_state": data['state']})
            )
            db.session.add(notification)
            
            # Send email notification to student
            admin_message = data.get('message') if data.get('message') else None
            
            # Special email for resolved problems
            if data['state'] == 'Problème traité':
                send_problem_resolved_email(problem, admin_message)
            else:
                # Regular status change email
                send_status_change_email(problem, data['state'], admin_message)
        
        db.session.commit()
        
        return jsonify({
            "message": "Problem updated successfully",
            "problem": {
                "id": problem.id,
                "state": problem.state,
                "message": problem.message,
                "updated_at": problem.updated_at.isoformat()
            }
        }), 200
        
    except ValidationError as e:
        print('VALIDATION ERROR:', e)
        return jsonify({"error": "Validation error", "details": e.messages}), 400
    except Exception as e:
        import traceback
        db.session.rollback()
        print('ERROR:', e)
        traceback.print_exc()
        return jsonify({"error": "Failed to update problem", "details": str(e)}), 500

@problems_bp.route('/<int:problem_id>/history', methods=['GET'])
@jwt_required()
def get_problem_history(problem_id):
    """Get problem history (admin only)"""
    try:
        claims = get_jwt()
        if claims.get('role') not in ['admin', 'moderator']:
            return jsonify({"error": "Insufficient permissions"}), 403
        
        history = db.session.query(ProblemHistory).filter_by(problem_id=problem_id)\
            .order_by(desc(ProblemHistory.created_at)).all()
        
        history_data = [{
            "id": entry.id,
            "action": entry.action,
            "old_value": entry.old_value,
            "new_value": entry.new_value,
            "user": {
                "name": entry.user.name,
                "surname": entry.user.surname
            },
            "created_at": entry.created_at.isoformat()
        } for entry in history]
        
        return jsonify({"history": history_data}), 200
        
    except Exception as e:
        return jsonify({"error": "Failed to fetch history"}), 500

@problems_bp.route('/categories', methods=['GET'])
@jwt_required()
@cache.cached(timeout=3600)  # Cache for 1 hour
def get_categories():
    """Get all available categories"""
    try:
        categories = db.session.query(Problem.category, func.count(Problem.id))\
            .group_by(Problem.category)\
            .order_by(func.count(Problem.id).desc()).all()
        
        return jsonify({
            "categories": [{"name": cat, "count": count} for cat, count in categories]
        }), 200
        
    except Exception as e:
        return jsonify({"error": "Failed to fetch categories"}), 500

@problems_bp.route('/stats', methods=['GET'])
@jwt_required()
@cache.cached(timeout=300)  # Cache for 5 minutes
def get_stats():
    """Get problem statistics"""
    try:
        claims = get_jwt()
        current_user_id = get_jwt_identity()
        
        # Base query
        query = db.session.query(Problem)
        
        # Filter by user role
        if claims.get('role') == 'student':
            query = query.filter(Problem.user_id == current_user_id)
        
        # Get counts
        total_problems = query.count()
        resolved_problems = query.filter(Problem.state == 'Problème traité').count()
        in_progress = query.filter(Problem.state == 'En cours de traitement').count()
        pending = query.filter(Problem.state == 'Soumis').count()
        
        # Get urgency distribution
        urgency_stats = db.session.query(
            Problem.urgency, func.count(Problem.id)
        ).group_by(Problem.urgency).all()
        
        # Get category distribution
        category_stats = db.session.query(
            Problem.category, func.count(Problem.id)
        ).group_by(Problem.category).order_by(func.count(Problem.id).desc()).limit(10).all()
        
        # Calculate average resolution time
        resolved_problems_with_time = query.filter(
            and_(
                Problem.state == 'Problème traité',
                Problem.resolved_at.isnot(None)
            )
        ).all()
        
        total_resolution_time = 0
        count_with_time = 0
        
        for problem in resolved_problems_with_time:
            if problem.resolved_at and problem.created_at:
                resolution_time = (problem.resolved_at - problem.created_at).total_seconds() / 3600  # hours
                total_resolution_time += resolution_time
                count_with_time += 1
        
        avg_resolution_time = total_resolution_time / count_with_time if count_with_time > 0 else 0
        
        return jsonify({
            "total_problems": total_problems,
            "resolved_problems": resolved_problems,
            "in_progress": in_progress,
            "pending": pending,
            "resolution_rate": (resolved_problems / total_problems * 100) if total_problems > 0 else 0,
            "avg_resolution_time_hours": round(avg_resolution_time, 2),
            "urgency_distribution": [
                {"urgency": urgency, "count": count} 
                for urgency, count in urgency_stats
            ],
            "top_categories": [
                {"category": category, "count": count} 
                for category, count in category_stats
            ]
        }), 200
        
    except Exception as e:
        return jsonify({"error": "Failed to fetch statistics"}), 500

@problems_bp.route('/all', methods=['GET', 'OPTIONS'])
@jwt_required()
@cache.cached(timeout=300)  # Cache for 5 minutes
def get_all_problems():
    """Get all problems for the all-problems page (anonymous view for students)"""
    # Handle OPTIONS request for CORS preflight
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        search = request.args.get('search', '')
        category = request.args.get('category', '')
        urgency = request.args.get('urgency', type=int)
        status = request.args.get('status', '')
        room = request.args.get('room', '')
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')
        
        # Get current user info
        current_user_id = get_jwt_identity()
        claims = get_jwt()
        user_role = claims.get('role')
        
        # Build query - show ALL problems for all-problems page
        query = db.session.query(Problem)
        
        # Apply filters
        if search:
            search_filter = or_(
                Problem.description.ilike(f'%{search}%'),
                Problem.type_of_problem.ilike(f'%{search}%'),
                Problem.room.ilike(f'%{search}%')
            )
            query = query.filter(search_filter)
        
        if category:
            query = query.filter(Problem.category == category)
        
        if urgency:
            query = query.filter(Problem.urgency == urgency)
        
        if status:
            query = query.filter(Problem.state == status)
        
        if room:
            query = query.filter(Problem.room.ilike(f'%{room}%'))
        
        # Apply sorting
        if sort_by == 'priority':
            query = query.order_by(desc(Problem.priority_score))
        elif sort_by == 'urgency':
            query = query.order_by(desc(Problem.urgency))
        elif sort_by == 'likes':
            query = query.order_by(desc(Problem.likes_count))
        else:
            query = query.order_by(desc(Problem.created_at))
        
        # Paginate
        pagination = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        # Check if user liked each problem
        problems_data = []
        
        for problem in pagination.items:
            # For students, always hide user names for confidentiality in all-problems view
            user_info = {}
            if user_role == 'admin':
                user_info = {
                    "name": problem.user.name,
                    "surname": problem.user.surname
                }
            else:
                # Hide user info for confidentiality
                user_info = {
                    "name": "Anonyme",
                    "surname": ""
                }
            
            problem_dict = {
                "id": problem.id,
                "user": user_info,
                "promotion": problem.promotion,
                "room": problem.room,
                "category": problem.category,
                "type_of_problem": problem.type_of_problem,
                "description": problem.description,
                "other": problem.other,
                "urgency": problem.urgency,
                "remark": problem.remark,
                "state": problem.state,
                "message": problem.message,
                "likes_count": problem.likes_count,
                "views_count": problem.views_count,
                "priority_score": problem.priority_score,
                "tags": json.loads(problem.tags) if problem.tags else [],
                "created_at": problem.created_at.isoformat(),
                "updated_at": problem.updated_at.isoformat(),
                "is_liked": db.session.query(ProblemLike).filter_by(
                    user_id=current_user_id, problem_id=problem.id
                ).first() is not None
            }
            problems_data.append(problem_dict)
        
        return jsonify({
            "problems": problems_data,
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
        return jsonify({"error": "Failed to fetch all problems"}), 500 