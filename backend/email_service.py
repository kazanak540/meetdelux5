from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import os
from datetime import datetime

class EmailService:
    def __init__(self):
        self.sendgrid_key = os.getenv('SENDGRID_API_KEY')
        self.sender_email = os.getenv('SENDER_EMAIL', 'confirmation@meetdelux.com')
        
    def send_customer_confirmation(self, booking_data):
        """Müşteriye rezervasyon konfirmasyonu gönder"""
        
        html_content = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .booking-details {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }}
                .detail-row {{ padding: 10px 0; border-bottom: 1px solid #eee; }}
                .label {{ font-weight: bold; color: #667eea; }}
                .footer {{ text-align: center; padding: 20px; color: #888; font-size: 12px; }}
                .button {{ background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✅ Rezervasyonunuz Onaylandı!</h1>
                    <p>MeetDelux'u seçtiğiniz için teşekkür ederiz</p>
                </div>
                <div class="content">
                    <h2>Sayın {booking_data.get('customer_name', 'Değerli Müşterimiz')},</h2>
                    <p>Rezervasyonunuz başarıyla oluşturulmuştur. Detaylar aşağıdadır:</p>
                    
                    <div class="booking-details">
                        <div class="detail-row">
                            <span class="label">Rezervasyon No:</span> {booking_data.get('booking_id', 'N/A')}
                        </div>
                        <div class="detail-row">
                            <span class="label">Otel/Salon:</span> {booking_data.get('venue_name', 'N/A')}
                        </div>
                        <div class="detail-row">
                            <span class="label">Salon Adı:</span> {booking_data.get('room_name', 'N/A')}
                        </div>
                        <div class="detail-row">
                            <span class="label">Tarih:</span> {booking_data.get('booking_date', 'N/A')}
                        </div>
                        <div class="detail-row">
                            <span class="label">Saat:</span> {booking_data.get('start_time', 'N/A')} - {booking_data.get('end_time', 'N/A')}
                        </div>
                        <div class="detail-row">
                            <span class="label">Kişi Sayısı:</span> {booking_data.get('guest_count', 'N/A')}
                        </div>
                        <div class="detail-row">
                            <span class="label">Toplam Ücret:</span> <strong>₺{booking_data.get('total_price', 'N/A')}</strong>
                        </div>
                    </div>
                    
                    <p><strong>Adres:</strong> {booking_data.get('venue_address', 'N/A')}</p>
                    <p><strong>İletişim:</strong> {booking_data.get('venue_phone', 'N/A')}</p>
                    
                    <center>
                        <a href="{booking_data.get('booking_url', '#')}" class="button">Rezervasyon Detaylarını Görüntüle</a>
                    </center>
                    
                    <p style="margin-top: 30px; font-size: 14px; color: #666;">
                        Herhangi bir sorunuz olması durumunda lütfen bizimle iletişime geçin.
                    </p>
                </div>
                <div class="footer">
                    <p>© 2025 MeetDelux - Türkiye'nin Toplantı Noktası</p>
                    <p>by Kazanak</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        message = Mail(
            from_email=self.sender_email,
            to_emails=booking_data.get('customer_email'),
            subject=f"✅ Rezervasyon Onayı - {booking_data.get('booking_id')}",
            html_content=html_content
        )
        
        try:
            if self.sendgrid_key and self.sendgrid_key != "your_sendgrid_api_key_here":
                sg = SendGridAPIClient(self.sendgrid_key)
                response = sg.send(message)
                return response.status_code == 202
            else:
                print("⚠️ SendGrid API key not configured. Email would be sent:")
                print(f"To: {booking_data.get('customer_email')}")
                print(f"Subject: Rezervasyon Onayı - {booking_data.get('booking_id')}")
                return True
        except Exception as e:
            print(f"Email gönderme hatası: {str(e)}")
            return False
    
    def send_owner_notification(self, booking_data):
        """Otel/Salon sahibine yeni rezervasyon bildirimi gönder"""
        
        html_content = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .booking-details {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }}
                .detail-row {{ padding: 10px 0; border-bottom: 1px solid #eee; }}
                .label {{ font-weight: bold; color: #059669; }}
                .footer {{ text-align: center; padding: 20px; color: #888; font-size: 12px; }}
                .alert {{ background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔔 Yeni Rezervasyon!</h1>
                    <p>Salonunuz için yeni bir rezervasyon aldınız</p>
                </div>
                <div class="content">
                    <div class="alert">
                        <strong>⏰ Acil:</strong> Yeni rezervasyon onayınızı bekliyor!
                    </div>
                    
                    <h2>Rezervasyon Detayları</h2>
                    
                    <div class="booking-details">
                        <div class="detail-row">
                            <span class="label">Rezervasyon No:</span> {booking_data.get('booking_id', 'N/A')}
                        </div>
                        <div class="detail-row">
                            <span class="label">Müşteri:</span> {booking_data.get('customer_name', 'N/A')}
                        </div>
                        <div class="detail-row">
                            <span class="label">Email:</span> {booking_data.get('customer_email', 'N/A')}
                        </div>
                        <div class="detail-row">
                            <span class="label">Telefon:</span> {booking_data.get('customer_phone', 'N/A')}
                        </div>
                        <div class="detail-row">
                            <span class="label">Salon:</span> {booking_data.get('room_name', 'N/A')}
                        </div>
                        <div class="detail-row">
                            <span class="label">Tarih:</span> {booking_data.get('booking_date', 'N/A')}
                        </div>
                        <div class="detail-row">
                            <span class="label">Saat:</span> {booking_data.get('start_time', 'N/A')} - {booking_data.get('end_time', 'N/A')}
                        </div>
                        <div class="detail-row">
                            <span class="label">Kişi Sayısı:</span> {booking_data.get('guest_count', 'N/A')}
                        </div>
                        <div class="detail-row">
                            <span class="label">Toplam Ücret:</span> <strong style="color: #059669;">₺{booking_data.get('total_price', 'N/A')}</strong>
                        </div>
                        <div class="detail-row">
                            <span class="label">Özel İstekler:</span> {booking_data.get('special_requests', 'Yok')}
                        </div>
                    </div>
                    
                    <p style="margin-top: 30px; font-size: 14px; color: #666;">
                        Lütfen dashboard üzerinden rezervasyonu onaylayın veya reddedin.
                    </p>
                </div>
                <div class="footer">
                    <p>© 2025 MeetDelux - Türkiye'nin Toplantı Noktası</p>
                    <p>by Kazanak</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        message = Mail(
            from_email=self.sender_email,
            to_emails=booking_data.get('owner_email'),
            subject=f"🔔 Yeni Rezervasyon - {booking_data.get('room_name')}",
            html_content=html_content
        )
        
        try:
            if self.sendgrid_key and self.sendgrid_key != "your_sendgrid_api_key_here":
                sg = SendGridAPIClient(self.sendgrid_key)
                response = sg.send(message)
                return response.status_code == 202
            else:
                print("⚠️ SendGrid API key not configured. Email would be sent:")
                print(f"To: {booking_data.get('owner_email')}")
                print(f"Subject: Yeni Rezervasyon - {booking_data.get('room_name')}")
                return True
        except Exception as e:
            print(f"Email gönderme hatası: {str(e)}")
            return False

# Global email service instance
email_service = EmailService()
