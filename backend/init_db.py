#!/usr/bin/env python3
"""
Database initialization script
Creates tables and adds sample data
"""

import os
import sys
from datetime import datetime, timedelta
from app import create_app, db
from models import (
    User, Problem, ProblemLike, Comment, Notification, 
    UserRole, ProblemStatus, UrgencyLevel
)
from flask_bcrypt import Bcrypt

def init_database():
    """Initialize the database with tables and sample data"""
    app = create_app()
    
    with app.app_context():
        # Create all tables
        print("Creating database tables...")
        db.create_all()
        
        # Initialize bcrypt
        bcrypt = Bcrypt(app)
        
        # Check if admin user already exists
        admin_user = User.query.filter_by(email='admin@easireport.com').first()
        if admin_user:
            print("Admin user already exists, skipping sample data creation")
            return
        
        print("Creating sample data...")
        
        # Create admin user
        admin_password = bcrypt.generate_password_hash('Admin123!').decode('utf-8')
        admin = User(
            email='admin@easireport.com',
            password_hash=admin_password,
            name='Admin',
            surname='User',
            role=UserRole.ADMIN,
            is_active=True,
            email_verified=True
        )
        db.session.add(admin)
        
        # Create sample students
        students_data = [
            {
                'email': 'student1@easireport.com',
                'name': 'Jean',
                'surname': 'Dupont',
                'promotion': 'SN1'
            },
            {
                'email': 'student2@easireport.com',
                'name': 'Marie',
                'surname': 'Martin',
                'promotion': 'SN2'
            },
            {
                'email': 'student3@easireport.com',
                'name': 'Pierre',
                'surname': 'Bernard',
                'promotion': 'B3FS'
            }
        ]
        
        students = []
        for student_data in students_data:
            password = bcrypt.generate_password_hash('Student123!').decode('utf-8')
            student = User(
                email=student_data['email'],
                password_hash=password,
                name=student_data['name'],
                surname=student_data['surname'],
                role=UserRole.STUDENT,
                is_active=True,
                email_verified=True
            )
            db.session.add(student)
            students.append(student)
        
        # Create sample problems
        problems_data = [
            {
                'room': 'Salle de classe',
                'category': 'Technologie et équipement',
                'type_of_problem': 'Vidéoprojecteur défaillant',
                'description': 'Le vidéoprojecteur ne s\'allume plus, écran noir',
                'urgency': UrgencyLevel.HIGH,
                'remark': 'Problème depuis ce matin, cours impossible',
                'promotion': 'SN1'
            },
            {
                'room': 'Laboratoires informatiques',
                'category': 'Ordinateurs et périphériques',
                'type_of_problem': 'Ordinateur en panne',
                'description': 'Ordinateur n°5 ne démarre plus',
                'urgency': UrgencyLevel.MEDIUM,
                'remark': 'Problème de démarrage, écran bleu',
                'promotion': 'SN2'
            },
            {
                'room': 'Cafétéria',
                'category': 'Climatisation',
                'type_of_problem': 'Climatisation défaillante',
                'description': 'La climatisation ne fonctionne plus',
                'urgency': UrgencyLevel.LOW,
                'remark': 'Température trop élevée',
                'promotion': 'B3FS'
            }
        ]
        
        problems = []
        for i, problem_data in enumerate(problems_data):
            problem = Problem(
                user_id=students[i].id,
                promotion=problem_data['promotion'],
                room=problem_data['room'],
                category=problem_data['category'],
                type_of_problem=problem_data['type_of_problem'],
                description=problem_data['description'],
                urgency=problem_data['urgency'],
                remark=problem_data['remark'],
                state=ProblemStatus.SUBMITTED,
                created_at=datetime.now() - timedelta(days=i+1)
            )
            db.session.add(problem)
            problems.append(problem)
        
        # Create sample likes
        for problem in problems:
            # Each student likes the problems of other students
            for student in students:
                if student.id != problem.user_id:
                    like = ProblemLike(
                        user_id=student.id,
                        problem_id=problem.id
                    )
                    db.session.add(like)
                    problem.likes_count += 1
        
        # Create sample comments
        comments_data = [
            "Je confirme le problème, c'est vraiment gênant",
            "Merci pour le signalement, nous allons traiter cela rapidement",
            "Problème similaire observé hier"
        ]
        
        for i, comment_text in enumerate(comments_data):
            comment = Comment(
                user_id=students[i % len(students)].id,
                problem_id=problems[i % len(problems)].id,
                content=comment_text,
                is_internal=False
            )
            db.session.add(comment)
        
        # Create sample notifications
        notifications_data = [
            {
                'title': 'Bienvenue sur EasyReport!',
                'message': 'Votre compte a été créé avec succès',
                'type': 'system'
            },
            {
                'title': 'Nouveau problème signalé',
                'message': 'Un problème a été signalé dans votre zone',
                'type': 'problem_update'
            }
        ]
        
        for user in students + [admin]:
            for notif_data in notifications_data:
                notification = Notification(
                    user_id=user.id,
                    title=notif_data['title'],
                    message=notif_data['message'],
                    type=notif_data['type'],
                    is_read=False
                )
                db.session.add(notification)
        
        # Commit all changes
        db.session.commit()
        
        print("Database initialized successfully!")
        print("\nSample users created:")
        print("Admin: admin@easireport.com / Admin123!")
        print("Students: student1@easireport.com / Student123!")
        print("         student2@easireport.com / Student123!")
        print("         student3@easireport.com / Student123!")

if __name__ == '__main__':
    init_database() 