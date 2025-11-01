from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta, timezone
import jwt
import bcrypt
from enum import Enum
# Stripe imports disabled - basic models used
import httpx
import asyncio
from decimal import Decimal, ROUND_HALF_UP
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Configure logging first
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-super-secret-jwt-key-for-hotel-booking-platform-2025')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Stripe Settings
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')
APP_URL = os.environ.get('APP_URL', 'http://localhost:3000')
if not STRIPE_API_KEY:
    logger.warning("STRIPE_API_KEY not found in environment variables - Payment features will be limited")

# Email Settings
SMTP_HOST = os.environ.get('SMTP_HOST')
SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
SMTP_USER = os.environ.get('SMTP_USER')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD')
SMTP_FROM_EMAIL = os.environ.get('SMTP_FROM_EMAIL')
SMTP_FROM_NAME = os.environ.get('SMTP_FROM_NAME', 'MeetDelux')

if not all([SMTP_HOST, SMTP_USER, SMTP_PASSWORD]):
    logger.warning("SMTP settings not configured - Email features will be disabled")

# Create the main app
app = FastAPI(title="MeetDelux - Lüks Seminer Salonu Rezervasyon API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Enums
class UserRole(str, Enum):
    CUSTOMER = "customer"
    HOTEL_MANAGER = "hotel_manager"
    ADMIN = "admin"

class BookingStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    REFUNDED = "refunded"
    FAILED = "failed"

class CurrencyCode(str, Enum):
    USD = "USD"
    EUR = "EUR"
    TRY = "TRY"

class AdvertisementType(str, Enum):
    HERO_BANNER = "hero_banner"
    FEATURED_HOTEL = "featured_hotel"
    SPONSORED_ROOM = "sponsored_room"
    SIDE_BANNER = "side_banner"
    BOTTOM_PROMOTION = "bottom_promotion"

class AdvertisementStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    EXPIRED = "expired"

class ApprovalStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

# Pydantic Models
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.CUSTOMER

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    created_at: datetime
    is_active: bool = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Hotel Models
class HotelCreate(BaseModel):
    name: str
    description: Optional[str] = None
    address: str
    city: str
    phone: str
    email: EmailStr
    website: Optional[str] = None
    star_rating: Optional[int] = Field(None, ge=1, le=5)
    facilities: List[str] = []
    images: List[str] = []
    videos: List[str] = []
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class HotelResponse(HotelCreate):
    id: str
    manager_id: str
    created_at: datetime
    is_active: bool = True
    approval_status: ApprovalStatus = ApprovalStatus.PENDING
    average_rating: float = 0.0
    total_reviews: int = 0

# Currency System Models
class ExchangeRateResponse(BaseModel):
    base_currency: str
    target_currency: str
    rate: float
    last_updated: datetime

class PricingInfo(BaseModel):
    base_price: float
    base_currency: CurrencyCode
    display_price: float
    display_currency: CurrencyCode
    exchange_rate: Optional[float] = None

# Conference Room Models
class ConferenceRoomCreate(BaseModel):
    name: str
    description: Optional[str] = None
    capacity: int = Field(..., ge=1)
    area_sqm: Optional[float] = Field(None, ge=0)
    price_per_day: float = Field(..., ge=0)
    price_per_hour: Optional[float] = Field(None, ge=0)
    currency: CurrencyCode = CurrencyCode.EUR  # Oteller EUR/USD bazında fiyat belirleyecek
    room_type: str = "conference"  # "conference", "meeting", "ballroom"
    features: List[str] = []  # ["projector", "sound_system", "whiteboard", "wifi", "air_conditioning"]
    layout_options: List[str] = []  # ["theater", "classroom", "u_shape", "boardroom"]
    images: List[str] = []
    videos: List[str] = []
    is_available: bool = True

class ConferenceRoomResponse(ConferenceRoomCreate):
    id: str
    hotel_id: str
    created_at: datetime
    approval_status: ApprovalStatus = ApprovalStatus.PENDING
    average_rating: float = 0.0
    total_bookings: int = 0
    pricing_info: Optional[PricingInfo] = None  # Kullanıcı lokasyonuna göre hesaplanmış fiyat

class ExchangeRateResponse(BaseModel):
    base_currency: str
    target_currency: str
    rate: float
    last_updated: datetime

class PricingInfo(BaseModel):
    base_price: float
    base_currency: CurrencyCode
    display_price: float
    display_currency: CurrencyCode
    exchange_rate: Optional[float] = None

# Extra Services Models
class ExtraServiceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float = Field(..., ge=0)
    currency: CurrencyCode = CurrencyCode.EUR  # Oteller EUR/USD bazında fiyat belirleyecek
    unit: str = "piece"  # "piece", "hour", "day", "person"
    category: str  # "catering", "equipment", "service", "transport", "refreshment"
    service_type: Optional[str] = None  # "breakfast", "lunch", "dinner", "coffee_break", "airport_transfer", "city_transfer"
    duration_minutes: Optional[int] = None  # Transfer süreleri için
    capacity_per_service: Optional[int] = None  # Kaç kişilik paket
    is_available: bool = True

class ExtraServiceResponse(ExtraServiceCreate):
    id: str
    hotel_id: str
    created_at: datetime
    pricing_info: Optional[PricingInfo] = None  # Kullanıcı lokasyonuna göre hesaplanmış fiyat

# Booking Models
class BookingServiceItem(BaseModel):
    service_id: str
    quantity: int = Field(..., ge=1)
    unit_price: float
    total_price: float

class HotelRoomBooking(BaseModel):
    check_in_date: datetime
    check_out_date: datetime
    room_count: int = Field(..., ge=1)
    guest_count: int = Field(..., ge=1)
    room_type: str = "standard"  # "standard", "deluxe", "suite"

class BookingCreate(BaseModel):
    room_id: str
    start_date: datetime
    end_date: datetime
    guest_count: int = Field(..., ge=1)
    booking_type: str = "daily"  # "daily", "hourly"
    special_requests: Optional[str] = None
    extra_services: List[BookingServiceItem] = []
    hotel_room_booking: Optional[HotelRoomBooking] = None  # Otel odası rezervasyonu
    contact_person: str
    contact_phone: str
    contact_email: EmailStr
    company_name: Optional[str] = None

class BookingResponse(BaseModel):
    id: str
    room_id: str
    customer_id: str
    start_date: datetime
    end_date: datetime
    guest_count: int
    booking_type: str
    total_days: int
    total_hours: Optional[int] = None
    room_price: float
    services_price: float
    total_price: float
    status: BookingStatus
    payment_status: PaymentStatus
    special_requests: Optional[str] = None
    extra_services: List[BookingServiceItem] = []
    contact_person: str
    contact_phone: str
    contact_email: str
    company_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class BookingUpdateStatus(BaseModel):
    status: BookingStatus
    notes: Optional[str] = None

# Availability Models
class AvailabilityCheck(BaseModel):
    room_id: str
    start_date: datetime
    end_date: datetime

class AvailabilityResponse(BaseModel):
    is_available: bool
    conflicting_bookings: List[str] = []
    suggested_dates: List[Dict[str, datetime]] = []

# Review & Rating Models
class ReviewCreate(BaseModel):
    booking_id: str
    hotel_rating: int = Field(..., ge=1, le=5)
    room_rating: int = Field(..., ge=1, le=5)
    service_rating: int = Field(..., ge=1, le=5)
    catering_rating: Optional[int] = Field(None, ge=1, le=5)
    overall_rating: int = Field(..., ge=1, le=5)
    title: str = Field(..., max_length=100)
    comment: str = Field(..., max_length=1000)
    would_recommend: bool = True
    event_type: str  # "seminer", "toplanti", "gala", "workshop"
    attendee_count: int = Field(..., ge=1)

class ReviewResponse(BaseModel):
    id: str
    booking_id: str
    customer_id: str
    customer_name: str
    hotel_id: str
    room_id: str
    hotel_rating: int
    room_rating: int
    service_rating: int
    catering_rating: Optional[int]
    overall_rating: int
    title: str
    comment: str
    would_recommend: bool
    event_type: str
    attendee_count: int
    created_at: datetime
    is_verified: bool = True  # Verified booking review
    hotel_response: Optional[str] = None
    hotel_response_date: Optional[datetime] = None

# Hotel Response to Review
class HotelReviewResponse(BaseModel):
    review_id: str
    response: str = Field(..., max_length=500)

# Advertisement Models
class AdvertisementCreate(BaseModel):
    title: str = Field(..., max_length=100)
    description: str = Field(..., max_length=500)
    ad_type: AdvertisementType
    target_id: Optional[str] = None  # hotel_id or room_id that this ad promotes
    target_url: Optional[str] = None  # custom URL to redirect to
    image_url: str
    start_date: datetime
    end_date: datetime
    priority: int = Field(default=0, ge=0, le=10)  # Higher priority ads show first
    max_daily_views: Optional[int] = Field(None, ge=1)  # Daily view limit
    is_active: bool = True

class AdvertisementResponse(AdvertisementCreate):
    id: str
    advertiser_id: str  # hotel_manager or admin who created the ad
    created_at: datetime
    updated_at: datetime
    total_views: int = 0
    total_clicks: int = 0
    status: AdvertisementStatus

class AdvertisementUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    image_url: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    priority: Optional[int] = Field(None, ge=0, le=10)
    max_daily_views: Optional[int] = Field(None, ge=1)
    is_active: Optional[bool] = None

class AdViewTrack(BaseModel):
    ad_id: str
    user_ip: Optional[str] = None
    user_agent: Optional[str] = None
    clicked: bool = False

# Payment Models
class PaymentTransactionCreate(BaseModel):
    booking_id: str
    amount: float
    currency: str = "TRY"
    payment_method: str = "stripe"

class PaymentTransactionResponse(BaseModel):
    id: str
    booking_id: str
    session_id: Optional[str] = None
    amount: float
    currency: str
    payment_method: str
    payment_status: PaymentStatus
    stripe_checkout_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class CreateCheckoutRequest(BaseModel):
    booking_id: str
    success_url: str
    cancel_url: str

# Utility Functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Email Utility Functions
async def send_email(to_email: str, subject: str, html_content: str, text_content: str = None):
    """Send email using SMTP"""
    if not all([SMTP_HOST, SMTP_USER, SMTP_PASSWORD]):
        logger.warning("SMTP not configured - Email not sent")
        return False
    
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['From'] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Add text and HTML parts
        if text_content:
            part1 = MIMEText(text_content, 'plain', 'utf-8')
            msg.attach(part1)
        
        part2 = MIMEText(html_content, 'html', 'utf-8')
        msg.attach(part2)
        
        # Send email
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        
        logger.info(f"Email sent successfully to {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False

def generate_booking_confirmation_email(booking: dict, room: dict, hotel: dict, user: dict) -> tuple:
    """Generate booking confirmation email HTML and text"""
    
    # Format dates
    check_in = booking.get('check_in_date', 'N/A')
    check_out = booking.get('check_out_date', 'N/A')
    
    # Calculate total
    total_price = booking.get('total_price', 0)
    currency = booking.get('currency', 'TRY')
    currency_symbols = {'TRY': '₺', 'EUR': '€', 'USD': '$'}
    symbol = currency_symbols.get(currency, currency)
    
    # HTML Email
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f9f9f9; padding: 30px; }}
            .booking-details {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }}
            .detail-row {{ display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }}
            .detail-label {{ font-weight: bold; color: #667eea; }}
            .total {{ background: #667eea; color: white; padding: 15px; border-radius: 8px; margin-top: 20px; text-align: center; font-size: 20px; font-weight: bold; }}
            .footer {{ background: #333; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }}
            .button {{ background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Rezervasyon Onayı</h1>
                <p>Rezervasyonunuz başarıyla oluşturuldu!</p>
            </div>
            
            <div class="content">
                <p>Sayın <strong>{user.get('full_name', 'Müşteri')}</strong>,</p>
                <p>MeetDelux üzerinden yaptığınız rezervasyon başarıyla oluşturulmuştur. Rezervasyon detaylarınız aşağıdadır:</p>
                
                <div class="booking-details">
                    <h3 style="color: #667eea; margin-top: 0;">📋 Rezervasyon Bilgileri</h3>
                    
                    <div class="detail-row">
                        <span class="detail-label">Rezervasyon No:</span>
                        <span>{booking.get('id', 'N/A')[:8].upper()}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="detail-label">🏨 Otel:</span>
                        <span>{hotel.get('name', 'N/A')}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="detail-label">🎓 Salon:</span>
                        <span>{room.get('name', 'N/A')}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="detail-label">📅 Giriş Tarihi:</span>
                        <span>{check_in}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="detail-label">📅 Çıkış Tarihi:</span>
                        <span>{check_out}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="detail-label">👥 Katılımcı:</span>
                        <span>{booking.get('number_of_guests', 'N/A')} Kişi</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="detail-label">📍 Adres:</span>
                        <span>{hotel.get('address', 'N/A')}, {hotel.get('city', 'N/A')}</span>
                    </div>
                    
                    <div class="total">
                        💰 Toplam Tutar: {symbol}{total_price:,.2f}
                    </div>
                </div>
                
                <p><strong>⚠️ Önemli Bilgiler:</strong></p>
                <ul>
                    <li>Lütfen rezervasyon numaranızı not alın</li>
                    <li>Ödeme işleminizi tamamlamak için hesabınıza giriş yapın</li>
                    <li>Sorularınız için: info@meetdelux.com</li>
                    <li>Telefon: +90 535 243 96 96</li>
                </ul>
                
                <center>
                    <a href="{APP_URL}/bookings" class="button">Rezervasyonlarımı Görüntüle</a>
                </center>
            </div>
            
            <div class="footer">
                <p><strong>MeetDelux</strong> - Türkiye'nin En Lüks Seminer Salonu Platformu</p>
                <p style="font-size: 12px; margin-top: 10px;">
                    Atakent Mah. Kutlutaş Sitesi A5 Blok Daire 1<br>
                    Halkalı, Küçükçekmece, İstanbul<br>
                    www.meetdelux.com
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Plain text version
    text = f"""
    REZERVASYON ONAYI - MeetDelux
    
    Sayın {user.get('full_name', 'Müşteri')},
    
    Rezervasyonunuz başarıyla oluşturulmuştur!
    
    REZERVASYON BİLGİLERİ:
    - Rezervasyon No: {booking.get('id', 'N/A')[:8].upper()}
    - Otel: {hotel.get('name', 'N/A')}
    - Salon: {room.get('name', 'N/A')}
    - Giriş: {check_in}
    - Çıkış: {check_out}
    - Katılımcı: {booking.get('number_of_guests', 'N/A')} Kişi
    - Adres: {hotel.get('address', 'N/A')}, {hotel.get('city', 'N/A')}
    
    TOPLAM TUTAR: {symbol}{total_price:,.2f}
    
    Rezervasyonlarınızı görüntülemek için: {APP_URL}/bookings
    
    İletişim: info@meetdelux.com | +90 535 243 96 96
    
    MeetDelux - Türkiye'nin En Lüks Seminer Salonu Platformu
    """
    
    return html, text

# Currency and Location Utility Functions
async def get_client_country_from_ip(client_ip: str) -> str:
    """Get country code from client IP address"""
    try:
        # Eğer localhost ise Türkiye varsay
        if client_ip in ["127.0.0.1", "localhost", "::1"]:
            return "TR"
        
        # IP geolocation servisini kullan
        async with httpx.AsyncClient() as client:
            response = await client.get(f"http://ip-api.com/json/{client_ip}")
            if response.status_code == 200:
                data = response.json()
                return data.get("countryCode", "TR")
    except Exception as e:
        logger.error(f"IP geolocation error: {e}")
    
    return "TR"  # Default to Turkey

async def get_display_currency(country_code: str) -> CurrencyCode:
    """Get display currency based on country code"""
    if country_code == "TR":
        return CurrencyCode.TRY
    elif country_code in ["US", "CA"]:
        return CurrencyCode.USD
    else:
        return CurrencyCode.EUR

async def get_exchange_rate(base_currency: str, target_currency: str) -> float:
    """Get exchange rate from exchangerate-api.com"""
    try:
        # Cache kontrolü - exchange rate'leri günlük cache'leyelim
        cache_key = f"exchange_rate_{base_currency}_{target_currency}"
        cached_rate = await db.exchange_rates.find_one({
            "cache_key": cache_key,
            "created_at": {"$gte": datetime.utcnow() - timedelta(hours=24)}
        })
        
        if cached_rate:
            return cached_rate["rate"]
        
        # API'den kur bilgisi al
        async with httpx.AsyncClient() as client:
            response = await client.get(f"https://api.exchangerate-api.com/v4/latest/{base_currency}")
            if response.status_code == 200:
                data = response.json()
                rate = data["rates"].get(target_currency, 1.0)
                
                # Cache'e kaydet
                await db.exchange_rates.insert_one({
                    "cache_key": cache_key,
                    "base_currency": base_currency,
                    "target_currency": target_currency,
                    "rate": rate,
                    "created_at": datetime.utcnow()
                })
                
                return rate
    except Exception as e:
        logger.error(f"Exchange rate fetch error: {e}")
    
    return 1.0  # Fallback to 1:1 rate

def calculate_display_price(base_price: float, base_currency: str, target_currency: str, exchange_rate: float) -> PricingInfo:
    """Calculate display price with currency conversion"""
    if base_currency == target_currency:
        display_price = base_price
        rate = None
    else:
        display_price = base_price * exchange_rate
        rate = exchange_rate
    
    # Round to 2 decimal places
    display_price = float(Decimal(str(display_price)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
    
    return PricingInfo(
        base_price=base_price,
        base_currency=CurrencyCode(base_currency),
        display_price=display_price,
        display_currency=CurrencyCode(target_currency),
        exchange_rate=rate
    )

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            logger.error("Email not found in JWT payload")
            raise credentials_exception
    except jwt.ExpiredSignatureError:
        logger.error("JWT token expired")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError as e:
        logger.error(f"JWT decode error: {e}")
        raise credentials_exception
    
    user = await db.users.find_one({"email": email})
    if user is None:
        logger.error(f"User not found: {email}")
        raise credentials_exception
    return user

# Auth Routes
@api_router.post("/auth/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user_dict = user_data.dict()
    user_dict["password"] = hash_password(user_data.password)
    user_dict["id"] = str(uuid.uuid4())
    user_dict["created_at"] = datetime.utcnow()
    user_dict["is_active"] = True
    
    await db.users.insert_one(user_dict)
    
    # Return user without password
    user_dict.pop("password")
    return UserResponse(**user_dict)

@api_router.post("/auth/login", response_model=Token)
async def login(user_credentials: UserLogin):
    user = await db.users.find_one({"email": user_credentials.email})
    if not user or not verify_password(user_credentials.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    
    # Prepare user response
    user_response = {k: v for k, v in user.items() if k != "password"}
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(**user_response)
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    current_user.pop("password", None)
    return UserResponse(**current_user)

# Hotel Routes
@api_router.post("/hotels", response_model=HotelResponse)
async def create_hotel(hotel_data: HotelCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in [UserRole.HOTEL_MANAGER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only hotel managers and admins can create hotels"
        )
    
    hotel_dict = hotel_data.dict()
    hotel_dict["id"] = str(uuid.uuid4())
    hotel_dict["manager_id"] = current_user["id"]
    hotel_dict["created_at"] = datetime.utcnow()
    hotel_dict["is_active"] = True
    hotel_dict["approval_status"] = ApprovalStatus.PENDING  # Yönetici onayı bekliyor
    hotel_dict["average_rating"] = 0.0
    hotel_dict["total_reviews"] = 0
    
    await db.hotels.insert_one(hotel_dict)
    
    return HotelResponse(**hotel_dict)

@api_router.get("/hotels", response_model=List[HotelResponse])
async def get_hotels(
    city: Optional[str] = None,
    star_rating: Optional[int] = None,
    skip: int = 0,
    limit: int = 20
):
    filter_query = {"is_active": True, "approval_status": ApprovalStatus.APPROVED}  # Sadece onaylanmış oteller
    
    if city:
        filter_query["city"] = {"$regex": city, "$options": "i"}
    if star_rating:
        filter_query["star_rating"] = star_rating
    
    hotels = await db.hotels.find(filter_query).skip(skip).limit(limit).to_list(length=limit)
    return [HotelResponse(**hotel) for hotel in hotels]

@api_router.get("/hotels/{hotel_id}", response_model=HotelResponse)
async def get_hotel(hotel_id: str):
    hotel = await db.hotels.find_one({"id": hotel_id, "is_active": True})
    if not hotel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hotel not found"
        )
    return HotelResponse(**hotel)

# Conference Room Routes
@api_router.post("/hotels/{hotel_id}/rooms", response_model=ConferenceRoomResponse)
async def create_conference_room(
    hotel_id: str,
    room_data: ConferenceRoomCreate,
    current_user: dict = Depends(get_current_user)
):
    # Check if hotel exists and user has permission
    hotel = await db.hotels.find_one({"id": hotel_id, "is_active": True})
    if not hotel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hotel not found"
        )
    
    if current_user["role"] == UserRole.HOTEL_MANAGER and hotel["manager_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only manage your own hotel's rooms"
        )
    elif current_user["role"] == UserRole.CUSTOMER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Customers cannot create conference rooms"
        )
    
    room_dict = room_data.dict()
    room_dict["id"] = str(uuid.uuid4())
    room_dict["hotel_id"] = hotel_id
    room_dict["created_at"] = datetime.utcnow()
    room_dict["approval_status"] = ApprovalStatus.PENDING  # Yönetici onayı bekliyor
    room_dict["average_rating"] = 0.0
    room_dict["total_bookings"] = 0
    
    await db.conference_rooms.insert_one(room_dict)
    
    return ConferenceRoomResponse(**room_dict)

@api_router.get("/hotels/{hotel_id}/rooms", response_model=List[ConferenceRoomResponse])
async def get_hotel_rooms(hotel_id: str, request: Request):
    rooms = await db.conference_rooms.find({
        "hotel_id": hotel_id,
        "is_available": True,
        "approval_status": ApprovalStatus.APPROVED  # Sadece onaylanmış odalar
    }).to_list(length=100)
    
    # Kur bilgisi hesapla
    client_ip = request.client.host
    country_code = await get_client_country_from_ip(client_ip)
    display_currency = await get_display_currency(country_code)
    
    # Her oda için fiyat hesapla
    for room in rooms:
        base_currency = room.get("currency", "EUR")
        if base_currency != display_currency.value:
            exchange_rate = await get_exchange_rate(base_currency, display_currency.value)
            room["pricing_info"] = calculate_display_price(
                room["price_per_day"], base_currency, display_currency.value, exchange_rate
            ).dict()
            
            if room.get("price_per_hour"):
                room["pricing_info"]["display_price_per_hour"] = float(
                    Decimal(str(room["price_per_hour"] * exchange_rate)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                )
    
    return [ConferenceRoomResponse(**room) for room in rooms]

@api_router.get("/rooms", response_model=List[ConferenceRoomResponse])
async def search_rooms(
    request: Request,
    city: Optional[str] = None,
    min_capacity: Optional[int] = None,
    max_price: Optional[float] = None,
    features: Optional[str] = None,  # comma-separated features
    skip: int = 0,
    limit: int = 20
):
    # First get hotels matching city filter if provided
    hotel_filter = {"is_active": True}
    if city:
        hotel_filter["city"] = {"$regex": city, "$options": "i"}
    
    hotels = await db.hotels.find(hotel_filter).to_list(length=1000)
    hotel_ids = [hotel["id"] for hotel in hotels]
    
    # Build room filter
    room_filter = {
        "is_available": True,
        "hotel_id": {"$in": hotel_ids}
    }
    
    if min_capacity:
        room_filter["capacity"] = {"$gte": min_capacity}
    if max_price:
        room_filter["price_per_day"] = {"$lte": max_price}
    if features:
        feature_list = [f.strip() for f in features.split(",")]
        room_filter["features"] = {"$in": feature_list}
    
    rooms = await db.conference_rooms.find(room_filter).skip(skip).limit(limit).to_list(length=limit)
    
    # Kur bilgisi hesapla
    client_ip = request.client.host
    country_code = await get_client_country_from_ip(client_ip)
    display_currency = await get_display_currency(country_code)
    
    # Her oda için fiyat hesapla
    for room in rooms:
        base_currency = room.get("currency", "EUR")
        if base_currency != display_currency.value:
            exchange_rate = await get_exchange_rate(base_currency, display_currency.value)
            room["pricing_info"] = calculate_display_price(
                room["price_per_day"], base_currency, display_currency.value, exchange_rate
            ).dict()
            
            if room.get("price_per_hour"):
                room["pricing_info"]["display_price_per_hour"] = float(
                    Decimal(str(room["price_per_hour"] * exchange_rate)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                )
    
    return [ConferenceRoomResponse(**room) for room in rooms]

@api_router.get("/rooms/{room_id}", response_model=ConferenceRoomResponse)
async def get_room(room_id: str, request: Request):
    room = await db.conference_rooms.find_one({"id": room_id, "is_available": True})
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conference room not found"
        )
    
    # Kur bilgisi hesapla
    client_ip = request.client.host
    country_code = await get_client_country_from_ip(client_ip)
    display_currency = await get_display_currency(country_code)
    
    base_currency = room.get("currency", "EUR")
    if base_currency != display_currency.value:
        exchange_rate = await get_exchange_rate(base_currency, display_currency.value)
        room["pricing_info"] = calculate_display_price(
            room["price_per_day"], base_currency, display_currency.value, exchange_rate
        ).dict()
        
        if room.get("price_per_hour"):
            room["pricing_info"]["display_price_per_hour"] = float(
                Decimal(str(room["price_per_hour"] * exchange_rate)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            )
    
    return ConferenceRoomResponse(**room)

# Extra Services Routes
@api_router.post("/hotels/{hotel_id}/services", response_model=ExtraServiceResponse)
async def create_extra_service(
    hotel_id: str,
    service_data: ExtraServiceCreate,
    current_user: dict = Depends(get_current_user)
):
    # Check permissions
    hotel = await db.hotels.find_one({"id": hotel_id, "is_active": True})
    if not hotel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hotel not found"
        )
    
    if current_user["role"] == UserRole.HOTEL_MANAGER and hotel["manager_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only manage your own hotel's services"
        )
    elif current_user["role"] == UserRole.CUSTOMER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Customers cannot create services"
        )
    
    service_dict = service_data.dict()
    service_dict["id"] = str(uuid.uuid4())
    service_dict["hotel_id"] = hotel_id
    service_dict["created_at"] = datetime.utcnow()
    
    await db.extra_services.insert_one(service_dict)
    
    return ExtraServiceResponse(**service_dict)

@api_router.post("/hotels/{hotel_id}/services/default")
async def create_default_services(
    hotel_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Create default catering and transfer services for a hotel"""
    # Check permissions
    hotel = await db.hotels.find_one({"id": hotel_id, "is_active": True})
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    
    if current_user["role"] == UserRole.HOTEL_MANAGER and hotel["manager_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="You can only manage your own hotel's services")
    elif current_user["role"] == UserRole.CUSTOMER:
        raise HTTPException(status_code=403, detail="Customers cannot create services")
    
    # Default catering services (prices in EUR)
    default_services = [
        # Catering Services
        {
            "name": "Sabah Kahvaltısı",
            "description": "Açık büfe kahvaltı, sıcak ve soğuk içecekler, reçel, peynir çeşitleri",
            "price": 15.0,
            "currency": "EUR",
            "unit": "person",
            "category": "catering",
            "service_type": "breakfast",
            "capacity_per_service": 1
        },
        {
            "name": "Öğle Yemeği",
            "description": "2 çorba, 4 ana yemek, salata büfesi, tatlı, sıcak ve soğuk içecekler",
            "price": 28.0,
            "currency": "EUR",
            "unit": "person",
            "category": "catering",
            "service_type": "lunch",
            "capacity_per_service": 1
        },
        {
            "name": "Akşam Yemeği",
            "description": "Premium menü, çorba, ana yemek, tatlı, limitsiz içecek servisi",
            "price": 40.0,
            "currency": "EUR",
            "unit": "person",
            "category": "catering",
            "service_type": "dinner",
            "capacity_per_service": 1
        },
        {
            "name": "Kahve Molası",
            "description": "Türk kahvesi, çay, kurabiye, küçük tatlılar",
            "price": 8.0,
            "currency": "EUR",
            "unit": "person",
            "category": "refreshment",
            "service_type": "coffee_break",
            "capacity_per_service": 1
        },
        {
            "name": "Premium Kahve & Atıştırmalık",
            "description": "Espresso, cappuccino, taze sandviçler, meyve, kuruyemiş",
            "price": 12.0,
            "currency": "EUR",
            "unit": "person",
            "category": "refreshment",
            "service_type": "coffee_break",
            "capacity_per_service": 1
        },
        
        # Personel & Destek Hizmetleri
        {
            "name": "Hostesin Desteği",
            "description": "Profesyonel hostesle etkinlik desteği, karşılama ve yönlendirme",
            "price": 25.0,
            "currency": "EUR",
            "unit": "hour",
            "category": "service",
            "service_type": "hostess_support",
            "capacity_per_service": 1
        },
        {
            "name": "Teknik Destek",
            "description": "Profesyonel ses ve görüntü teknisyeni desteği",
            "price": 35.0,
            "currency": "EUR",
            "unit": "hour",
            "category": "service",
            "service_type": "technical_support",
            "capacity_per_service": 1
        },
        {
            "name": "Çevirmen Desteği",
            "description": "İngilizce/Türkçe simultane çevirmen hizmeti",
            "price": 50.0,
            "currency": "EUR",
            "unit": "hour",
            "category": "service",
            "service_type": "interpreter",
            "capacity_per_service": 1
        },
        
        # Transfer Services
        {
            "name": "Havalimanı Transfer",
            "description": "İstanbul Havalimanı ↔ Otel arası transfer hizmeti (lüks araç)",
            "price": 80.0,
            "currency": "EUR",
            "unit": "trip",
            "category": "transport",
            "service_type": "airport_transfer",
            "duration_minutes": 60,
            "capacity_per_service": 4
        },
        {
            "name": "Sabiha Gökçen Transfer",
            "description": "Sabiha Gökçen Havalimanı ↔ Otel arası transfer hizmeti",
            "price": 95.0,
            "currency": "EUR",
            "unit": "trip",
            "category": "transport",
            "service_type": "airport_transfer",
            "duration_minutes": 90,
            "capacity_per_service": 4
        },
        {
            "name": "Şehir İçi Transfer",
            "description": "İstanbul şehir merkezindeki önemli noktalara transfer",
            "price": 50.0,
            "currency": "EUR",
            "unit": "trip",
            "category": "transport",
            "service_type": "city_transfer",
            "duration_minutes": 30,
            "capacity_per_service": 4
        },
        {
            "name": "Grup Transfer (Minibüs)",
            "description": "8-15 kişilik grup transferi için minibüs hizmeti",
            "price": 130.0,
            "currency": "EUR",
            "unit": "trip",
            "category": "transport",
            "service_type": "group_transfer",
            "duration_minutes": 45,
            "capacity_per_service": 15
        },
        
        # Etkinlik & Eğlence Hizmetleri
        {
            "name": "Koktey Servisi",
            "description": "Premium içecek servisi, özel kokteyller, profesyonel barista",
            "price": 18.0,
            "currency": "EUR",
            "unit": "person",
            "category": "catering",
            "service_type": "cocktail_service",
            "capacity_per_service": 1
        },
        {
            "name": "Doğum Günü Pastası",
            "description": "Özel tasarım doğum günü pastası, kişiye özel mesaj",
            "price": 150.0,
            "currency": "EUR",
            "unit": "piece",
            "category": "catering",
            "service_type": "birthday_cake",
            "capacity_per_service": 20
        },
        {
            "name": "Çiçek Düzenleme",
            "description": "Profesyonel çiçek aranjmanı, masa ve sahne dekorasyonu",
            "price": 250.0,
            "currency": "EUR",
            "unit": "set",
            "category": "decoration",
            "service_type": "flower_arrangement",
            "capacity_per_service": 1
        },
        {
            "name": "Fotoğrafçı Hizmeti",
            "description": "Profesyonel fotoğrafçı, etkinlik çekimi, dijital albüm",
            "price": 80.0,
            "currency": "EUR",
            "unit": "hour",
            "category": "service",
            "service_type": "photographer",
            "capacity_per_service": 1
        },
        {
            "name": "Müzik Grubu",
            "description": "Canlı müzik performansı, DJ veya akustik grup seçenekleri",
            "price": 200.0,
            "currency": "EUR",
            "unit": "hour",
            "category": "entertainment",
            "service_type": "live_music",
            "capacity_per_service": 1
        },
        {
            "name": "Sahne Düzenlemesi",
            "description": "Profesyonel sahne kurulumu, podyum, dekorasyon",
            "price": 350.0,
            "currency": "EUR",
            "unit": "set",
            "category": "equipment",
            "service_type": "stage_setup",
            "capacity_per_service": 1
        },
        {
            "name": "LED Ekran Kiralama",
            "description": "Büyük boy LED ekran, full HD görüntü, teknik destek dahil",
            "price": 120.0,
            "currency": "EUR",
            "unit": "day",
            "category": "equipment",
            "service_type": "led_screen",
            "capacity_per_service": 1
        },
        {
            "name": "Ekstra Ses Sistemi",
            "description": "Güçlendirilmiş ses sistemi, ekstra hoparlörler, mikrofon seti",
            "price": 80.0,
            "currency": "EUR",
            "unit": "day",
            "category": "equipment",
            "service_type": "extra_sound_system",
            "capacity_per_service": 1
        }
    ]
    
    created_services = []
    for service_data in default_services:
        # Check if service already exists
        existing = await db.extra_services.find_one({
            "hotel_id": hotel_id,
            "name": service_data["name"]
        })
        
        if not existing:
            service_dict = service_data.copy()
            service_dict["id"] = str(uuid.uuid4())
            service_dict["hotel_id"] = hotel_id
            service_dict["created_at"] = datetime.utcnow()
            service_dict["is_available"] = True
            
            await db.extra_services.insert_one(service_dict)
            created_services.append(service_dict["name"])
    
    return {
        "success": True,
        "created_services": created_services,
        "message": f"{len(created_services)} default service created for {hotel['name']}"
    }

@api_router.get("/hotels/{hotel_id}/services", response_model=List[ExtraServiceResponse])
async def get_hotel_services(hotel_id: str, request: Request):
    services = await db.extra_services.find({
        "hotel_id": hotel_id,
        "is_available": True
    }).to_list(length=100)
    
    # Kur bilgisi hesapla
    client_ip = request.client.host
    country_code = await get_client_country_from_ip(client_ip)
    display_currency = await get_display_currency(country_code)
    
    # Her servis için fiyat hesapla
    for service in services:
        base_currency = service.get("currency", "EUR")
        if base_currency != display_currency.value:
            exchange_rate = await get_exchange_rate(base_currency, display_currency.value)
            service["pricing_info"] = calculate_display_price(
                service["price"], base_currency, display_currency.value, exchange_rate
            ).dict()
    
    return [ExtraServiceResponse(**service) for service in services]

# Booking Routes
@api_router.post("/bookings", response_model=BookingResponse)
async def create_booking(booking_data: BookingCreate, current_user: dict = Depends(get_current_user)):
    # Verify room exists
    room = await db.conference_rooms.find_one({"id": booking_data.room_id, "is_available": True})
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conference room not found or not available"
        )
    
    # Check availability
    availability = await check_room_availability(booking_data.room_id, booking_data.start_date, booking_data.end_date)
    if not availability["is_available"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Room is not available for the selected dates"
        )
    
    # Calculate pricing
    total_days = (booking_data.end_date - booking_data.start_date).days
    if total_days <= 0:
        total_days = 1
    
    total_hours = None
    if booking_data.booking_type == "hourly":
        total_hours = int((booking_data.end_date - booking_data.start_date).total_seconds() / 3600)
        if not room.get("price_per_hour"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Hourly booking not available for this room"
            )
        room_price = room["price_per_hour"] * total_hours
    else:
        room_price = room["price_per_day"] * total_days
    
    # Calculate services price
    services_price = sum(service.total_price for service in booking_data.extra_services)
    total_price = room_price + services_price
    
    # Create booking
    booking_dict = booking_data.dict()
    booking_dict.update({
        "id": str(uuid.uuid4()),
        "customer_id": current_user["id"],
        "total_days": total_days,
        "total_hours": total_hours,
        "room_price": room_price,
        "services_price": services_price,
        "total_price": total_price,
        "status": BookingStatus.PENDING,
        "payment_status": PaymentStatus.PENDING,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    })
    
    await db.bookings.insert_one(booking_dict)
    
    # Send confirmation email
    try:
        # Get hotel details
        hotel = await db.hotels.find_one({"id": room["hotel_id"]})
        
        if hotel:
            # Generate email
            html_content, text_content = generate_booking_confirmation_email(
                booking=booking_dict,
                room=room,
                hotel=hotel,
                user=current_user
            )
            
            # Send email
            await send_email(
                to_email=current_user["email"],
                subject=f"🎉 Rezervasyon Onayı - {hotel['name']}",
                html_content=html_content,
                text_content=text_content
            )
            logger.info(f"Confirmation email sent to {current_user['email']} for booking {booking_dict['id']}")
    except Exception as e:
        # Log error but don't fail the booking
        logger.error(f"Failed to send confirmation email: {str(e)}")
    
    return BookingResponse(**booking_dict)

@api_router.get("/bookings", response_model=List[BookingResponse])
async def get_user_bookings(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == UserRole.CUSTOMER:
        # Customer sees only their bookings
        bookings = await db.bookings.find({"customer_id": current_user["id"]}).to_list(1000)
    elif current_user["role"] == UserRole.HOTEL_MANAGER:
        # Hotel manager sees bookings for their hotels
        user_hotels = await db.hotels.find({"manager_id": current_user["id"]}).to_list(1000)
        hotel_ids = [hotel["id"] for hotel in user_hotels]
        
        # Get rooms for user's hotels
        rooms = await db.conference_rooms.find({"hotel_id": {"$in": hotel_ids}}).to_list(1000)
        room_ids = [room["id"] for room in rooms]
        
        bookings = await db.bookings.find({"room_id": {"$in": room_ids}}).to_list(1000)
    else:  # Admin
        # Admin sees all bookings
        bookings = await db.bookings.find().to_list(1000)
    
    return [BookingResponse(**booking) for booking in bookings]

@api_router.get("/bookings/{booking_id}", response_model=BookingResponse)
async def get_booking(booking_id: str, current_user: dict = Depends(get_current_user)):
    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Check permissions
    if current_user["role"] == UserRole.CUSTOMER and booking["customer_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own bookings"
        )
    elif current_user["role"] == UserRole.HOTEL_MANAGER:
        # Check if this booking is for manager's hotel
        room = await db.conference_rooms.find_one({"id": booking["room_id"]})
        if room:
            hotel = await db.hotels.find_one({"id": room["hotel_id"], "manager_id": current_user["id"]})
            if not hotel:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You can only view bookings for your hotels"
                )
    
    return BookingResponse(**booking)

@api_router.patch("/bookings/{booking_id}/status", response_model=BookingResponse)
async def update_booking_status(
    booking_id: str, 
    status_update: BookingUpdateStatus, 
    current_user: dict = Depends(get_current_user)
):
    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Check permissions - only hotel managers and admins can update status
    if current_user["role"] == UserRole.CUSTOMER:
        # Customers can only cancel their own bookings
        if booking["customer_id"] != current_user["id"] or status_update.status != BookingStatus.CANCELLED:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only cancel your own bookings"
            )
    elif current_user["role"] == UserRole.HOTEL_MANAGER:
        # Check if this booking is for manager's hotel
        room = await db.conference_rooms.find_one({"id": booking["room_id"]})
        if room:
            hotel = await db.hotels.find_one({"id": room["hotel_id"], "manager_id": current_user["id"]})
            if not hotel:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You can only manage bookings for your hotels"
                )
    
    # Update booking
    update_data = {
        "status": status_update.status,
        "updated_at": datetime.utcnow()
    }
    if status_update.notes:
        update_data["notes"] = status_update.notes
    
    await db.bookings.update_one({"id": booking_id}, {"$set": update_data})
    
    # Get updated booking
    updated_booking = await db.bookings.find_one({"id": booking_id})
    return BookingResponse(**updated_booking)

@api_router.post("/rooms/{room_id}/availability", response_model=AvailabilityResponse)
async def check_room_availability_endpoint(room_id: str, availability_check: AvailabilityCheck):
    result = await check_room_availability(room_id, availability_check.start_date, availability_check.end_date)
    return AvailabilityResponse(**result)

@api_router.get("/rooms/{room_id}/bookings")
async def get_room_bookings(
    room_id: str, 
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    # Check if user has permission to view this room's bookings
    room = await db.conference_rooms.find_one({"id": room_id})
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    if current_user["role"] == UserRole.HOTEL_MANAGER:
        hotel = await db.hotels.find_one({"id": room["hotel_id"], "manager_id": current_user["id"]})
        if not hotel:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view bookings for your hotels"
            )
    elif current_user["role"] == UserRole.CUSTOMER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Customers cannot view room booking schedules"
        )
    
    # Build query
    query = {"room_id": room_id, "status": {"$ne": BookingStatus.CANCELLED}}
    
    if start_date and end_date:
        start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        query["$or"] = [
            {"start_date": {"$lte": end_dt}, "end_date": {"$gte": start_dt}}
        ]
    
    bookings = await db.bookings.find(query).to_list(1000)
    return [BookingResponse(**booking) for booking in bookings]

# Utility function for availability checking
async def check_room_availability(room_id: str, start_date: datetime, end_date: datetime) -> dict:
    # Find conflicting bookings
    conflicting_bookings = await db.bookings.find({
        "room_id": room_id,
        "status": {"$in": [BookingStatus.PENDING, BookingStatus.CONFIRMED]},
        "$or": [
            {"start_date": {"$lte": end_date}, "end_date": {"$gte": start_date}}
        ]
    }).to_list(1000)
    
    is_available = len(conflicting_bookings) == 0
    
    return {
        "is_available": is_available,
        "conflicting_bookings": [booking["id"] for booking in conflicting_bookings],
        "suggested_dates": []  # Could be implemented later
    }

# Payment Routes
@api_router.post("/bookings/{booking_id}/payment", response_model=PaymentTransactionResponse)
async def create_payment_checkout(
    booking_id: str,
    checkout_request: CreateCheckoutRequest,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    # Verify booking exists and belongs to user
    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Check permissions
    if current_user["role"] == UserRole.CUSTOMER and booking["customer_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only create payments for your own bookings"
        )
    
    # Check if booking is confirmed
    if booking["status"] != BookingStatus.CONFIRMED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only confirmed bookings can be paid"
        )
    
    # Check if payment already exists
    existing_payment = await db.payment_transactions.find_one({
        "booking_id": booking_id,
        "payment_status": {"$in": [PaymentStatus.PENDING, PaymentStatus.PAID]}
    })
    
    if existing_payment:
        return PaymentTransactionResponse(**existing_payment)
    
    try:
        # Initialize Stripe checkout
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        # Create checkout session request
        amount = float(booking["total_price"])  # Ensure float format
        currency = "TRY"  # Turkish Lira
        
        checkout_session_request = CheckoutSessionRequest(
            amount=amount,
            currency=currency,
            success_url=checkout_request.success_url,
            cancel_url=checkout_request.cancel_url,
            metadata={
                "booking_id": booking_id,
                "customer_id": current_user["id"],
                "customer_email": current_user["email"]
            }
        )
        
        # Create checkout session
        session_response: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_session_request)
        
        # Create payment transaction record
        payment_transaction = {
            "id": str(uuid.uuid4()),
            "booking_id": booking_id,
            "session_id": session_response.session_id,
            "amount": amount,
            "currency": currency,
            "payment_method": "stripe",
            "payment_status": PaymentStatus.PENDING,
            "stripe_checkout_url": session_response.url,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        await db.payment_transactions.insert_one(payment_transaction)
        
        return PaymentTransactionResponse(**payment_transaction)
        
    except Exception as e:
        logger.error(f"Payment creation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create payment session"
        )

@api_router.get("/payments/{session_id}/status", response_model=PaymentTransactionResponse)
async def get_payment_status(session_id: str, current_user: dict = Depends(get_current_user)):
    # Find payment transaction
    payment = await db.payment_transactions.find_one({"session_id": session_id})
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment transaction not found"
        )
    
    # Check permissions
    booking = await db.bookings.find_one({"id": payment["booking_id"]})
    if current_user["role"] == UserRole.CUSTOMER and booking["customer_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only check your own payment status"
        )
    
    try:
        # Initialize Stripe checkout with APP_URL from environment
        webhook_url = f"{APP_URL}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        # Get checkout status from Stripe
        checkout_status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
        
        # Update payment status if changed
        new_payment_status = PaymentStatus.PENDING
        if checkout_status.payment_status == "paid":
            new_payment_status = PaymentStatus.PAID
        elif checkout_status.status == "expired":
            new_payment_status = PaymentStatus.FAILED
        
        # Update payment transaction if status changed
        if payment["payment_status"] != new_payment_status:
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {
                    "$set": {
                        "payment_status": new_payment_status,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            # If payment is successful, update booking payment status
            if new_payment_status == PaymentStatus.PAID:
                await db.bookings.update_one(
                    {"id": payment["booking_id"]},
                    {
                        "$set": {
                            "payment_status": PaymentStatus.PAID,
                            "updated_at": datetime.utcnow()
                        }
                    }
                )
            
            # Get updated payment
            payment = await db.payment_transactions.find_one({"session_id": session_id})
        
        return PaymentTransactionResponse(**payment)
        
    except Exception as e:
        logger.error(f"Payment status check error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to check payment status"
        )

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    try:
        body = await request.body()
        stripe_signature = request.headers.get("Stripe-Signature")
        
        if not stripe_signature:
            raise HTTPException(status_code=400, detail="Missing Stripe signature")
        
        # Initialize Stripe checkout with APP_URL from environment
        webhook_url = f"{APP_URL}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        # Handle webhook
        webhook_response = await stripe_checkout.handle_webhook(body, stripe_signature)
        
        # Process webhook based on event type
        if webhook_response.event_type == "checkout.session.completed":
            session_id = webhook_response.session_id
            
            # Update payment status
            payment = await db.payment_transactions.find_one({"session_id": session_id})
            if payment:
                # Update payment transaction
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {
                        "$set": {
                            "payment_status": PaymentStatus.PAID,
                            "updated_at": datetime.utcnow()
                        }
                    }
                )
                
                # Update booking payment status
                await db.bookings.update_one(
                    {"id": payment["booking_id"]},
                    {
                        "$set": {
                            "payment_status": PaymentStatus.PAID,
                            "updated_at": datetime.utcnow()
                        }
                    }
                )
        
        return {"status": "success"}
        
    except Exception as e:
        logger.error(f"Webhook processing error: {e}")
        raise HTTPException(status_code=400, detail="Webhook processing failed")

# File Upload Routes
import os
import shutil
from pathlib import Path

# Create upload directories
UPLOAD_DIR = Path("/app/uploads")
HOTEL_IMAGES_DIR = UPLOAD_DIR / "hotels"
ROOM_IMAGES_DIR = UPLOAD_DIR / "rooms"
VIDEO_DIR = UPLOAD_DIR / "videos"

# Create directories if they don't exist
UPLOAD_DIR.mkdir(exist_ok=True)
HOTEL_IMAGES_DIR.mkdir(exist_ok=True)
ROOM_IMAGES_DIR.mkdir(exist_ok=True)
VIDEO_DIR.mkdir(exist_ok=True)

@api_router.post("/hotels/{hotel_id}/upload-image")
async def upload_hotel_image(
    hotel_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    # Check permissions
    hotel = await db.hotels.find_one({"id": hotel_id})
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    
    if current_user["role"] == UserRole.HOTEL_MANAGER and hotel["manager_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="You can only manage your own hotel's images")
    elif current_user["role"] == UserRole.CUSTOMER:
        raise HTTPException(status_code=403, detail="Customers cannot upload images")
    
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Generate unique filename
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{hotel_id}_{uuid.uuid4()}.{file_extension}"
    file_path = HOTEL_IMAGES_DIR / unique_filename
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Create public URL using environment variable
        image_url = f"{APP_URL}/api/images/hotels/{unique_filename}"
        
        # Update hotel images array
        await db.hotels.update_one(
            {"id": hotel_id},
            {"$push": {"images": image_url}}
        )
        
        return {"success": True, "image_url": image_url}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")

@api_router.post("/rooms/{room_id}/upload-image")
async def upload_room_image(
    room_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    # Check permissions
    room = await db.conference_rooms.find_one({"id": room_id})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    hotel = await db.hotels.find_one({"id": room["hotel_id"]})
    if current_user["role"] == UserRole.HOTEL_MANAGER and hotel["manager_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="You can only manage your own hotel's room images")
    elif current_user["role"] == UserRole.CUSTOMER:
        raise HTTPException(status_code=403, detail="Customers cannot upload images")
    
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Generate unique filename
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{room_id}_{uuid.uuid4()}.{file_extension}"
    file_path = ROOM_IMAGES_DIR / unique_filename
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Create public URL using environment variable
        image_url = f"{APP_URL}/api/images/rooms/{unique_filename}"
        
        # Update room images array
        await db.conference_rooms.update_one(
            {"id": room_id},
            {"$push": {"images": image_url}}
        )
        
        return {"success": True, "image_url": image_url}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")

# Serve uploaded images
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

@api_router.get("/images/hotels/{filename}")
async def get_hotel_image(filename: str):
    file_path = HOTEL_IMAGES_DIR / filename
    if file_path.exists():
        return FileResponse(file_path)
    raise HTTPException(status_code=404, detail="Image not found")

@api_router.get("/images/rooms/{filename}")
async def get_room_image(filename: str):
    file_path = ROOM_IMAGES_DIR / filename
    if file_path.exists():
        return FileResponse(file_path)
    raise HTTPException(status_code=404, detail="Image not found")

# Review & Rating Routes
@api_router.post("/reviews", response_model=ReviewResponse)
async def create_review(review_data: ReviewCreate, current_user: dict = Depends(get_current_user)):
    # Verify booking exists and belongs to user
    booking = await db.bookings.find_one({"id": review_data.booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking["customer_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Can only review your own bookings")
    
    # Check if booking is completed
    if booking["status"] != BookingStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Can only review completed bookings")
    
    # Check if review already exists
    existing_review = await db.reviews.find_one({"booking_id": review_data.booking_id})
    if existing_review:
        raise HTTPException(status_code=400, detail="Review already exists for this booking")
    
    # Get room and hotel info
    room = await db.conference_rooms.find_one({"id": booking["room_id"]})
    
    # Create review
    review_dict = review_data.dict()
    review_dict.update({
        "id": str(uuid.uuid4()),
        "customer_id": current_user["id"],
        "customer_name": current_user["full_name"],
        "hotel_id": room["hotel_id"],
        "room_id": booking["room_id"],
        "created_at": datetime.utcnow(),
        "is_verified": True,
        "hotel_response": None,
        "hotel_response_date": None
    })
    
    await db.reviews.insert_one(review_dict)
    
    # Update hotel and room ratings
    await update_ratings(room["hotel_id"], booking["room_id"])
    
    return ReviewResponse(**review_dict)

@api_router.get("/hotels/{hotel_id}/reviews", response_model=List[ReviewResponse])
async def get_hotel_reviews(hotel_id: str, skip: int = 0, limit: int = 20):
    reviews = await db.reviews.find({"hotel_id": hotel_id}).sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)
    return [ReviewResponse(**review) for review in reviews]

@api_router.get("/rooms/{room_id}/reviews", response_model=List[ReviewResponse])
async def get_room_reviews(room_id: str, skip: int = 0, limit: int = 20):
    reviews = await db.reviews.find({"room_id": room_id}).sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)
    return [ReviewResponse(**review) for review in reviews]

@api_router.post("/reviews/{review_id}/response")
async def respond_to_review(review_id: str, response_data: HotelReviewResponse, current_user: dict = Depends(get_current_user)):
    # Get review
    review = await db.reviews.find_one({"id": review_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # Check permissions - only hotel manager can respond
    hotel = await db.hotels.find_one({"id": review["hotel_id"]})
    if current_user["role"] != UserRole.HOTEL_MANAGER or hotel["manager_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only hotel managers can respond to reviews")
    
    # Update review with hotel response
    await db.reviews.update_one(
        {"id": review_id},
        {
            "$set": {
                "hotel_response": response_data.response,
                "hotel_response_date": datetime.utcnow()
            }
        }
    )
    
    return {"success": True, "message": "Response added successfully"}

async def update_ratings(hotel_id: str, room_id: str):
    """Update average ratings for hotel and room"""
    # Hotel ratings
    hotel_reviews = await db.reviews.find({"hotel_id": hotel_id}).to_list(length=1000)
    if hotel_reviews:
        avg_rating = sum(review["overall_rating"] for review in hotel_reviews) / len(hotel_reviews)
        await db.hotels.update_one(
            {"id": hotel_id},
            {"$set": {"average_rating": round(avg_rating, 1), "total_reviews": len(hotel_reviews)}}
        )
    
    # Room ratings
    room_reviews = await db.reviews.find({"room_id": room_id}).to_list(length=1000)
    if room_reviews:
        avg_rating = sum(review["room_rating"] for review in room_reviews) / len(room_reviews)
        await db.conference_rooms.update_one(
            {"id": room_id},
            {"$set": {"average_rating": round(avg_rating, 1)}}
        )

# Currency System APIs
@api_router.get("/currency/rates")
async def get_exchange_rates(request: Request):
    """Get current exchange rates for all supported currencies"""
    client_ip = request.client.host
    country_code = await get_client_country_from_ip(client_ip)
    display_currency = await get_display_currency(country_code)
    
    rates = {}
    base_currencies = [CurrencyCode.USD, CurrencyCode.EUR]
    
    for base in base_currencies:
        if base != display_currency:
            rate = await get_exchange_rate(base.value, display_currency.value)
            rates[f"{base.value}_to_{display_currency.value}"] = rate
    
    return {
        "country": country_code,
        "display_currency": display_currency.value,
        "rates": rates,
        "updated_at": datetime.utcnow()
    }

@api_router.get("/currency/detect")
async def detect_user_currency(request: Request):
    """Detect user's currency based on IP location"""
    client_ip = request.client.host
    country_code = await get_client_country_from_ip(client_ip)
    display_currency = await get_display_currency(country_code)
    
    return {
        "ip": client_ip,
        "country": country_code,
        "currency": display_currency.value
    }

# Advertisement Routes
@api_router.post("/advertisements", response_model=AdvertisementResponse)
async def create_advertisement(
    ad_data: AdvertisementCreate,
    current_user: dict = Depends(get_current_user)
):
    # Only hotel managers and admins can create ads
    if current_user["role"] == UserRole.CUSTOMER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only hotel managers and admins can create advertisements"
        )
    
    # If hotel manager, verify target_id belongs to their hotel
    if current_user["role"] == UserRole.HOTEL_MANAGER and ad_data.target_id:
        if ad_data.ad_type == AdvertisementType.FEATURED_HOTEL:
            hotel = await db.hotels.find_one({"id": ad_data.target_id, "manager_id": current_user["id"]})
            if not hotel:
                raise HTTPException(status_code=403, detail="You can only advertise your own hotels")
        elif ad_data.ad_type == AdvertisementType.SPONSORED_ROOM:
            room = await db.conference_rooms.find_one({"id": ad_data.target_id})
            if room:
                hotel = await db.hotels.find_one({"id": room["hotel_id"], "manager_id": current_user["id"]})
                if not hotel:
                    raise HTTPException(status_code=403, detail="You can only advertise rooms from your own hotels")
    
    ad_dict = ad_data.dict()
    ad_dict["id"] = str(uuid.uuid4())
    ad_dict["advertiser_id"] = current_user["id"]
    ad_dict["created_at"] = datetime.utcnow()
    ad_dict["updated_at"] = datetime.utcnow()
    ad_dict["total_views"] = 0
    ad_dict["total_clicks"] = 0
    
    # Set status based on dates
    now = datetime.now(timezone.utc)
    start_date = ad_data.start_date.replace(tzinfo=None) if ad_data.start_date.tzinfo else ad_data.start_date
    end_date = ad_data.end_date.replace(tzinfo=None) if ad_data.end_date.tzinfo else ad_data.end_date
    now_naive = now.replace(tzinfo=None)
    
    if start_date <= now_naive <= end_date and ad_data.is_active:
        ad_dict["status"] = AdvertisementStatus.ACTIVE
    elif now_naive > end_date:
        ad_dict["status"] = AdvertisementStatus.EXPIRED
    else:
        ad_dict["status"] = AdvertisementStatus.INACTIVE
    
    await db.advertisements.insert_one(ad_dict)
    return AdvertisementResponse(**ad_dict)

@api_router.get("/advertisements", response_model=List[AdvertisementResponse])
async def get_advertisements(
    ad_type: Optional[AdvertisementType] = None,
    status: Optional[AdvertisementStatus] = None,
    limit: int = 10,
    current_user: dict = Depends(get_current_user)
):
    # Only admins and hotel managers can list ads
    if current_user["role"] == UserRole.CUSTOMER:
        raise HTTPException(status_code=403, detail="Access denied")
    
    filter_query = {}
    if current_user["role"] == UserRole.HOTEL_MANAGER:
        filter_query["advertiser_id"] = current_user["id"]
    
    if ad_type:
        filter_query["ad_type"] = ad_type
    if status:
        filter_query["status"] = status
    
    ads = await db.advertisements.find(filter_query).limit(limit).to_list(length=limit)
    return [AdvertisementResponse(**ad) for ad in ads]

@api_router.get("/advertisements/public", response_model=List[AdvertisementResponse])
async def get_public_advertisements(
    ad_type: Optional[AdvertisementType] = None,
    limit: int = 10
):
    """Public endpoint to get active advertisements for homepage"""
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    filter_query = {
        "status": AdvertisementStatus.ACTIVE,
        "is_active": True,
        "start_date": {"$lte": now},
        "end_date": {"$gte": now}
    }
    
    if ad_type:
        filter_query["ad_type"] = ad_type
    
    # Sort by priority (higher first), then by created date
    ads = await db.advertisements.find(filter_query).sort([
        ("priority", -1),
        ("created_at", -1)
    ]).limit(limit).to_list(length=limit)
    
    return [AdvertisementResponse(**ad) for ad in ads]

@api_router.post("/advertisements/{ad_id}/view")
async def track_ad_view(ad_id: str, track_data: AdViewTrack, request: Request):
    """Track advertisement view/click"""
    # Update ad view/click count
    update_data = {"$inc": {"total_views": 1}}
    if track_data.clicked:
        update_data["$inc"]["total_clicks"] = 1
    
    await db.advertisements.update_one(
        {"id": ad_id},
        update_data
    )
    
    # Log the view for analytics
    view_log = {
        "id": str(uuid.uuid4()),
        "ad_id": ad_id,
        "user_ip": track_data.user_ip or request.client.host,
        "user_agent": track_data.user_agent or request.headers.get("user-agent"),
        "clicked": track_data.clicked,
        "timestamp": datetime.utcnow()
    }
    
    await db.ad_views.insert_one(view_log)
    return {"success": True}

@api_router.put("/advertisements/{ad_id}", response_model=AdvertisementResponse)
async def update_advertisement(
    ad_id: str,
    ad_update: AdvertisementUpdate,
    current_user: dict = Depends(get_current_user)
):
    # Find the ad
    ad = await db.advertisements.find_one({"id": ad_id})
    if not ad:
        raise HTTPException(status_code=404, detail="Advertisement not found")
    
    # Check permissions
    if current_user["role"] == UserRole.HOTEL_MANAGER and ad["advertiser_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="You can only update your own advertisements")
    elif current_user["role"] == UserRole.CUSTOMER:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Update the ad
    update_data = {k: v for k, v in ad_update.dict(exclude_unset=True).items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    # Update status if needed
    if "start_date" in update_data or "end_date" in update_data or "is_active" in update_data:
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        start_date = update_data.get("start_date", ad["start_date"])
        end_date = update_data.get("end_date", ad["end_date"])
        is_active = update_data.get("is_active", ad["is_active"])
        
        # Handle timezone conversion
        if hasattr(start_date, 'tzinfo') and start_date.tzinfo:
            start_date = start_date.replace(tzinfo=None)
        if hasattr(end_date, 'tzinfo') and end_date.tzinfo:
            end_date = end_date.replace(tzinfo=None)
        
        if start_date <= now <= end_date and is_active:
            update_data["status"] = AdvertisementStatus.ACTIVE
        elif now > end_date:
            update_data["status"] = AdvertisementStatus.EXPIRED
        else:
            update_data["status"] = AdvertisementStatus.INACTIVE
    
    await db.advertisements.update_one({"id": ad_id}, {"$set": update_data})
    
    # Get updated ad
    updated_ad = await db.advertisements.find_one({"id": ad_id})
    return AdvertisementResponse(**updated_ad)

@api_router.delete("/advertisements/{ad_id}")
async def delete_advertisement(ad_id: str, current_user: dict = Depends(get_current_user)):
    # Find the ad
    ad = await db.advertisements.find_one({"id": ad_id})
    if not ad:
        raise HTTPException(status_code=404, detail="Advertisement not found")
    
    # Check permissions
    if current_user["role"] == UserRole.HOTEL_MANAGER and ad["advertiser_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="You can only delete your own advertisements")
    elif current_user["role"] == UserRole.CUSTOMER:
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.advertisements.delete_one({"id": ad_id})
    return {"success": True, "message": "Advertisement deleted successfully"}

# Health check
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "message": "MeetDelux API is running!"}

# Admin Routes - Approval System
@api_router.get("/admin/hotels/pending", response_model=List[HotelResponse])
async def get_pending_hotels(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access this endpoint"
        )
    
    hotels = await db.hotels.find({"approval_status": ApprovalStatus.PENDING}).to_list(length=100)
    return [HotelResponse(**hotel) for hotel in hotels]

@api_router.put("/admin/hotels/{hotel_id}/approve")
async def approve_hotel(hotel_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can approve hotels"
        )
    
    result = await db.hotels.update_one(
        {"id": hotel_id},
        {"$set": {"approval_status": ApprovalStatus.APPROVED}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hotel not found"
        )
    
    return {"message": "Hotel approved successfully", "hotel_id": hotel_id}

@api_router.put("/admin/hotels/{hotel_id}/reject")
async def reject_hotel(hotel_id: str, reason: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can reject hotels"
        )
    
    update_data = {"approval_status": ApprovalStatus.REJECTED}
    if reason:
        update_data["rejection_reason"] = reason
    
    result = await db.hotels.update_one(
        {"id": hotel_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hotel not found"
        )
    
    return {"message": "Hotel rejected", "hotel_id": hotel_id}

@api_router.get("/admin/rooms/pending", response_model=List[ConferenceRoomResponse])
async def get_pending_rooms(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access this endpoint"
        )
    
    rooms = await db.conference_rooms.find({"approval_status": ApprovalStatus.PENDING}).to_list(length=100)
    return [ConferenceRoomResponse(**room) for room in rooms]

@api_router.put("/admin/rooms/{room_id}/approve")
async def approve_room(room_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can approve rooms"
        )
    
    result = await db.conference_rooms.update_one(
        {"id": room_id},
        {"$set": {"approval_status": ApprovalStatus.APPROVED}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    return {"message": "Room approved successfully", "room_id": room_id}

@api_router.put("/admin/rooms/{room_id}/reject")
async def reject_room(room_id: str, reason: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can reject rooms"
        )
    
    update_data = {"approval_status": ApprovalStatus.REJECTED}
    if reason:
        update_data["rejection_reason"] = reason
    
    result = await db.conference_rooms.update_one(
        {"id": room_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    return {"message": "Room rejected", "room_id": room_id}

# Include the router in the main app
# Delete Hotel Endpoint
@api_router.delete('/hotels/{hotel_id}')
async def delete_hotel(hotel_id: str, current_user: dict = Depends(get_current_user)):
    user = current_user
    hotel = await db.hotels.find_one({'id': hotel_id})
    if not hotel:
        raise HTTPException(status_code=404, detail='Hotel not found')
    if user['role'] not in ['admin', 'hotel_manager']:
        raise HTTPException(status_code=403, detail='Not authorized')
    if user['role'] == 'hotel_manager' and hotel['manager_id'] != user['user_id']:
        raise HTTPException(status_code=403, detail='Not authorized to delete this hotel')
    await db.conference_rooms.delete_many({'hotel_id': hotel_id})
    result = await db.hotels.delete_one({'id': hotel_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail='Hotel not found')
    return {'message': 'Hotel deleted successfully'}

# Delete Room Endpoint
@api_router.delete('/rooms/{room_id}')
async def delete_room(room_id: str, current_user: dict = Depends(get_current_user)):
    user = current_user
    room = await db.conference_rooms.find_one({'id': room_id})
    if not room:
        raise HTTPException(status_code=404, detail='Room not found')
    hotel = await db.hotels.find_one({'id': room['hotel_id']})
    if not hotel:
        raise HTTPException(status_code=404, detail='Hotel not found')
    if user['role'] not in ['admin', 'hotel_manager']:
        raise HTTPException(status_code=403, detail='Not authorized')
    if user['role'] == 'hotel_manager' and hotel['manager_id'] != user['user_id']:
        raise HTTPException(status_code=403, detail='Not authorized to delete this room')
    result = await db.conference_rooms.delete_one({'id': room_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail='Room not found')
    return {'message': 'Room deleted successfully'}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
