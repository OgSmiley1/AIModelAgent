import os
from datetime import timedelta

class Config:
    """Application configuration"""
    
    # Flask settings
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'crc-sales-warroom-2025-secret-key'
    
    # Authentication settings
    AUTH_USERNAME = 'CRC'
    AUTH_PASSWORD = 'Smile123'
    
    # Data storage settings
    DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
    
    # Performance settings
    MAX_REFRESH_TIME = 30  # seconds
    CACHE_TIMEOUT = timedelta(minutes=15)
    
    # Validation settings
    MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB
    ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'xls'}
    
    # Default configuration values
    DEFAULT_PRIORITY_WEIGHTS = {
        'availability_weight': 40,
        'availability_date_weight': 30,
        'probability_weight': 30
    }
    
    DEFAULT_THRESHOLDS = {
        'urgent_followup_days': 0,
        'needs_followup_days': 7,
        'inactive_threshold': 14,
        'days_to_needs_followup': 7,
        'days_to_overdue': 14
    }
    
    # Excel export settings
    EXCEL_TEMPLATE_PATH = os.path.join(os.path.dirname(__file__), 'templates', 'excel')
    
    # Audit log settings
    MAX_LOG_ENTRIES = 1000
    LOG_RETENTION_DAYS = 90
    
    # Mobile PWA settings
    PWA_NAME = 'CRC Sales Warroom'
    PWA_SHORT_NAME = 'CRC Sales'
    PWA_DESCRIPTION = 'Advanced luxury watch sales and lead management system'
    PWA_THEME_COLOR = '#1a202c'
    PWA_BACKGROUND_COLOR = '#ffffff'
    PWA_DISPLAY = 'standalone'
    PWA_ORIENTATION = 'portrait'
    
    # Session configuration for mobile
    SESSION_COOKIE_SECURE = False  # Set to True in production with HTTPS
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    PERMANENT_SESSION_LIFETIME = timedelta(hours=8)
    
    # Currency settings
    DEFAULT_CURRENCY = 'AED'
    CURRENCY_SYMBOL = 'AED'
    
    @staticmethod
    def init_app(app):
        """Initialize application with configuration"""
        # Create necessary directories
        os.makedirs(Config.DATA_DIR, exist_ok=True)
        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
        os.makedirs(Config.EXCEL_TEMPLATE_PATH, exist_ok=True)
