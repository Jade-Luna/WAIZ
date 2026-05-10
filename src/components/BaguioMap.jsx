import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useState, useEffect } from 'react'
import { supabase } from '../supabase/config'
import { Link } from 'react-router-dom'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const featuredIcon = new L.DivIcon({
  className: '',
  html: `<div style="background:#C97A3A;width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3)"><div style="transform:rotate(45deg);color:#fff;font-size:14px;text-align:center;line-height:30px">★</div></div>`,
  iconSize:[34,34], iconAnchor:[17,34], popupAnchor:[0,-38],
})

const regularIcon = new L.DivIcon({
  className: '',
  html: `<div style="background:#1A4D35;width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.25)"><div style="transform:rotate(45deg);color:#fff;font-size:12px;text-align:center;line-height:26px">♻</div></div>`,
  iconSize:[30,30], iconAnchor:[15,30], popupAnchor:[0,-34],
})

const userIcon = new L.DivIcon({
  className: '',
  html: `<div style="background:#3B82F6;width:14px;height:14px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 3px rgba(59,130,246,0.35)"></div>`,
  iconSize:[14,14], iconAnchor:[7,7],
})

const USER_LOCATION = [16.4023, 120.5960]

export default function BaguioMap({
  height       = '400px',
  showUserPin  = false,
  userBarangay = '',
}) {
  const [shops,            setShops]            = useState([])
  const [selectedShop,     setSelectedShop]     = useState(null)
  const [showRoute,        setShowRoute]        = useState(false)
  const [routeCoords,      setRouteCoords]      = useState([])
  const [userRealLocation, setUserRealLocation] = useState(null)

  useEffect(() => { fetchShops() }, [])

  const fetchShops = async () => {
    const { data } = await supabase
      .from('junkshops')
      .select('*, profiles(full_name)')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
    setShops(data || [])
  }

  const fetchRoute = async (userLat, userLng, shopLat, shopLng) => {
    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${shopLng},${shopLat}?overview=full&geometries=geojson`
      )
      const data = await res.json()
      if (data.routes && data.routes.length > 0) {
        const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng])
        setRouteCoords(coords)
      }
    } catch (e) {
      console.error('Route fetch failed:', e)
      setRouteCoords([])
    }
  }

  const handleGetDirections = (shop) => {
    setSelectedShop(shop)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userLat = pos.coords.latitude
          const userLng = pos.coords.longitude
          setUserRealLocation([userLat, userLng])
          fetchRoute(userLat, userLng, shop.latitude, shop.longitude)
          setShowRoute(true)
        },
        () => {
          fetchRoute(USER_LOCATION[0], USER_LOCATION[1], shop.latitude, shop.longitude)
          setShowRoute(true)
        }
      )
    } else {
      fetchRoute(USER_LOCATION[0], USER_LOCATION[1], shop.latitude, shop.longitude)
      setShowRoute(true)
    }
  }

  const mapsUrl = selectedShop
    ? `https://www.google.com/maps/dir/${(userRealLocation || USER_LOCATION).join(',')}/${selectedShop.latitude},${selectedShop.longitude}`
    : '#'

  return (
    <div style={{ position: 'relative' }}>

      {/* Map */}
      <div style={{ height, width: '100%', borderRadius: '16px', overflow: 'hidden', zIndex: 1 }}>
        <MapContainer
          center={[16.4023, 120.5960]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}>

          <TileLayer
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Road route polyline */}
          {routeCoords.length > 0 && (
            <Polyline positions={routeCoords} color="#C97A3A" weight={4} opacity={0.8} />
          )}

          {/* Junkshop markers */}
          {shops.map(shop => (
            <Marker
              key={shop.id}
              position={[shop.latitude, shop.longitude]}
              icon={shop.is_featured ? featuredIcon : regularIcon}
              eventHandlers={{
                click: () => { setSelectedShop(shop); setShowRoute(false); setRouteCoords([]) }
              }}>
              <Popup>
                <div style={{ fontFamily: 'sans-serif', minWidth: '180px', padding: '4px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: '#0D2B1F', marginBottom: '4px' }}>
                    {shop.shop_name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#666', marginBottom: '2px' }}>
                    📍 {shop.barangay}
                  </div>
                  <div style={{ fontSize: '11px', color: '#C97A3A', marginBottom: '4px' }}>
                    ★ {shop.rating || 'New'}
                  </div>
                  {shop.custom_rates && shop.custom_rates.length > 0 && (
                    <div style={{ fontSize: '11px', color: '#1A4D35', marginBottom: '8px' }}>
                      {shop.custom_rates.slice(0, 3).map(r => `${r.label} ₱${r.price}/kg`).join(' · ')}
                    </div>
                  )}
                  {shop.is_featured && (
                    <div style={{ fontSize: '10px', background: '#D8F3DC', color: '#1A4D35', padding: '2px 8px', borderRadius: '8px', display: 'inline-block', marginBottom: '6px' }}>
                      Featured on WAIZ
                    </div>
                  )}
                  <br />
                  <Link
  to={`/junkshop/${shop.id}`}
  style={{ fontSize:'11px', background:'#F0FDF4', color:'#1A4D35', border:'1px solid #B7E4C7', borderRadius:'8px', padding:'5px 10px', cursor:'pointer', width:'100%', marginTop:'4px', textDecoration:'none', display:'block', textAlign:'center', boxSizing:'border-box' }}>
  View profile
</Link>
                  <a
                    href={`https://www.google.com/maps?q=&layer=c&cbll=${shop.latitude},${shop.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize:'11px', background:'#EFF6FF', color:'#1D4ED8', border:'1px solid #BFDBFE', borderRadius:'8px', padding:'5px 10px', cursor:'pointer', width:'100%', marginTop:'4px', textDecoration:'none', display:'block', textAlign:'center', boxSizing:'border-box' }}>
                    🔵 Street View
                  </a>
                  <button
                    onClick={() => handleGetDirections(shop)}
                    style={{ fontSize: '11px', background: '#1A4D35', color: '#fff', border: 'none', borderRadius: '8px', padding: '5px 10px', cursor: 'pointer', width: '100%', marginTop: '4px' }}>
                    🗺️ Get directions
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Empty state */}
          {shops.length === 0 && (
            <Marker position={[16.4023, 120.5960]} icon={userIcon}>
              <Popup>
                <div style={{ fontFamily: 'sans-serif', fontSize: '12px', textAlign: 'center' }}>
                  <b>Baguio City</b><br />
                  No junkshops have pinned their location yet
                </div>
              </Popup>
            </Marker>
          )}

          {/* User pin */}
          {showUserPin && (
            <Marker position={USER_LOCATION} icon={userIcon}>
              <Popup>
                <div style={{ fontFamily: 'sans-serif', fontSize: '12px' }}>
                  <b>Your location</b><br />{userBarangay || 'Baguio City'}
                </div>
              </Popup>
            </Marker>
          )}

        </MapContainer>
      </div>

      {/* Direction panel */}
      {showRoute && selectedShop && (
        <div style={{
          position: 'absolute', bottom: '12px', left: '12px', right: '12px',
          background: '#fff', borderRadius: '12px', padding: '12px 14px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px'
        }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#0D2B1F', margin: 0 }}>
              Directions to {selectedShop.shop_name}
            </p>
            <p style={{ fontSize: '11px', color: '#666', margin: '2px 0 0' }}>
              📍 {selectedShop.barangay} · Following road route
            </p>
          </div>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: '11px', background: '#C97A3A', color: '#fff', borderRadius: '8px', padding: '6px 10px', whiteSpace: 'nowrap', textDecoration: 'none' }}>
            Open in Google Maps
          </a>
          <button
            onClick={() => { setShowRoute(false); setRouteCoords([]) }}
            style={{ fontSize: '13px', background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '0 4px' }}>
            ✕
          </button>
        </div>
      )}

    </div>
  )
}