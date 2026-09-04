import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const title = searchParams.get('title') || 'Clévia Immobilier'
  const subtitle = searchParams.get('subtitle') || 'Location courte durée · Maroc'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #2C1A0E 0%, #3D2517 50%, #2C1A0E 100%)',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* Decorative circle */}
        <div
          style={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(201,123,75,0.15), transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -80,
            left: -80,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(201,123,75,0.1), transparent 70%)',
          }}
        />

        {/* Logo icon */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: '#C97B4B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: '#FAF6F1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#C97B4B',
              }}
            />
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            color: '#FAF6F1',
            textAlign: 'center',
            lineHeight: 1.2,
            maxWidth: 900,
            marginBottom: 16,
          }}
        >
          {title}
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 24,
            color: '#C97B4B',
            textAlign: 'center',
            maxWidth: 700,
          }}
        >
          {subtitle}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div style={{ color: 'rgba(250,246,241,0.5)', fontSize: 16 }}>
            cleviamaroc.com
          </div>
          <div style={{ color: 'rgba(250,246,241,0.2)', fontSize: 16 }}>•</div>
          <div style={{ color: 'rgba(250,246,241,0.5)', fontSize: 16 }}>
            Airbnb · Booking · Avito
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
