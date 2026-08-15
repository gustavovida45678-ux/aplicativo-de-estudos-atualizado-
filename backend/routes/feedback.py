from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter()

# Email configuration
ADMIN_EMAIL = "francesdefranceff@gmail.com"


class FeedbackRequest(BaseModel):
    user_name: str
    user_email: EmailStr
    subject: str
    message: str


@router.post("/send")
async def send_feedback(feedback: FeedbackRequest):
    """
    Send feedback/suggestion email to admin
    """
    try:
        logger.info(f"📧 Feedback received from: {feedback.user_name} ({feedback.user_email})")
        logger.info(f"📝 Subject: {feedback.subject}")
        
        # Create email content
        email_body = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; padding: 20px; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
                .info-box {{ background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #8b5cf6; }}
                .message-box {{ background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
                .footer {{ text-align: center; color: #666; font-size: 12px; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>💡 Nova Sugestão Recebida</h1>
                    <p>Academia de Estudos - Plataforma de Aprendizado</p>
                </div>
                
                <div class="content">
                    <div class="info-box">
                        <h3>👤 Informações do Usuário</h3>
                        <p><strong>Nome:</strong> {feedback.user_name}</p>
                        <p><strong>Email:</strong> {feedback.user_email}</p>
                        <p><strong>Data:</strong> {datetime.now().strftime("%d/%m/%Y às %H:%M")}</p>
                    </div>
                    
                    <div class="info-box">
                        <h3>📋 Assunto</h3>
                        <p><strong>{feedback.subject}</strong></p>
                    </div>
                    
                    <div class="message-box">
                        <h3>💬 Mensagem</h3>
                        <p style="white-space: pre-wrap;">{feedback.message}</p>
                    </div>
                    
                    <div class="footer">
                        <p>Este email foi enviado automaticamente pela plataforma Academia de Estudos</p>
                        <p>Para responder, envie um email para: {feedback.user_email}</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        # For now, just log the feedback (email sending requires SMTP configuration)
        logger.info("=" * 80)
        logger.info("📧 FEEDBACK EMAIL CONTENT:")
        logger.info(f"From: {feedback.user_name} <{feedback.user_email}>")
        logger.info(f"To: {ADMIN_EMAIL}")
        logger.info(f"Subject: [Sugestão] {feedback.subject}")
        logger.info(f"Message:\n{feedback.message}")
        logger.info("=" * 80)
        
        # TODO: Implement actual email sending with SMTP
        # For production, you would need to configure SMTP settings
        # Example:
        # msg = MIMEMultipart('alternative')
        # msg['Subject'] = f"[Sugestão] {feedback.subject}"
        # msg['From'] = feedback.user_email
        # msg['To'] = ADMIN_EMAIL
        # msg.attach(MIMEText(email_body, 'html'))
        # 
        # with smtplib.SMTP('smtp.gmail.com', 587) as server:
        #     server.starttls()
        #     server.login(SMTP_USER, SMTP_PASSWORD)
        #     server.send_message(msg)
        
        logger.info("✅ Feedback logged successfully")
        
        return {
            "success": True,
            "message": "Sugestão recebida com sucesso! Entraremos em contato em breve.",
            "admin_email": ADMIN_EMAIL
        }
        
    except Exception as e:
        logger.error(f"❌ Error processing feedback: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Erro ao enviar sugestão. Por favor, tente novamente."
        )
