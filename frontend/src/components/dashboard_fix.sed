# Yeni Otel butonu - sadece hotel_manager için
/onClick={() => setShowCreateHotelModal(true)}/,+3 {
    s|<Button|{user.role === 'hotel_manager' \&\& <Button|
    /Yeni Otel|İlk Otelimi Ekle/ {
        s|</Button>|</Button>}|
    }
}

# Yeni Salon butonu - sadece hotel_manager için  
/onClick={() => setShowCreateRoomModal(true)}/,+3 {
    s|<Button|{user.role === 'hotel_manager' \&\& <Button|
    /Yeni Salon|İlk Salonumu Ekle/ {
        s|</Button>|</Button>}|
    }
}
