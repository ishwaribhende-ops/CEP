import os

images = {
    'pothole1.svg': '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="100%" height="100%">
  <rect width="600" height="400" fill="#334155"/>
  <line x1="300" y1="0" x2="300" y2="100" stroke="#F59E0B" stroke-width="12" stroke-dasharray="25,20"/>
  <line x1="300" y1="140" x2="300" y2="400" stroke="#F59E0B" stroke-width="12" stroke-dasharray="25,20"/>
  <ellipse cx="280" cy="220" rx="140" ry="80" fill="#0F172A" stroke="#1E293B" stroke-width="8"/>
  <ellipse cx="270" cy="225" rx="110" ry="55" fill="#020617"/>
  <path d="M150,210 Q200,200 240,215 T180,240" stroke="#475569" stroke-width="4" fill="none"/>
  <path d="M410,210 Q370,230 350,215 T380,250" stroke="#475569" stroke-width="4" fill="none"/>
  <path d="M260,140 Q270,170 280,180" stroke="#475569" stroke-width="4" fill="none"/>
  <circle cx="230" cy="180" r="6" fill="#64748B"/>
  <circle cx="340" cy="270" r="8" fill="#64748B"/>
  <circle cx="190" cy="250" r="5" fill="#64748B"/>
  <circle cx="360" cy="170" r="7" fill="#64748B"/>
  <ellipse cx="285" cy="230" rx="70" ry="30" fill="#1E3A8A" opacity="0.6"/>
  <text x="30" y="45" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#FFFFFF">Varale Phata - Severe Pothole</text>
  <rect x="30" y="60" width="130" height="24" rx="4" fill="#DC2626"/>
  <text x="40" y="77" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#FFFFFF">HIGH SEVERITY</text>
</svg>''',
    'damaged_road1.svg': '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="100%" height="100%">
  <rect width="600" height="400" fill="#475569"/>
  <line x1="0" y1="200" x2="600" y2="200" stroke="#E2E8F0" stroke-width="8" stroke-dasharray="40,30"/>
  <path d="M50,150 L180,180 L260,130 L350,210 L480,170 L550,230" stroke="#0F172A" stroke-width="7" fill="none"/>
  <path d="M180,180 L210,270 L300,290 L340,350" stroke="#0F172A" stroke-width="6" fill="none"/>
  <path d="M350,210 L390,280 L460,310" stroke="#0F172A" stroke-width="5" fill="none"/>
  <path d="M260,130 L310,70 L380,50" stroke="#0F172A" stroke-width="5" fill="none"/>
  <rect x="120" y="80" width="90" height="60" rx="10" fill="#334155" opacity="0.8"/>
  <rect x="380" y="220" width="120" height="70" rx="15" fill="#334155" opacity="0.8"/>
  <text x="30" y="45" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#FFFFFF">Chakan-Talegaon Link Road</text>
  <rect x="30" y="60" width="120" height="24" rx="4" fill="#D97706"/>
  <text x="40" y="77" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#FFFFFF">DAMAGED ROAD</text>
</svg>''',
    'drainage1.svg': '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="100%" height="100%">
  <rect width="600" height="400" fill="#334155"/>
  <rect x="0" y="280" width="600" height="120" fill="#64748B"/>
  <line x1="0" y1="280" x2="600" y2="280" stroke="#CBD5E1" stroke-width="6"/>
  <rect x="220" y="290" width="160" height="80" rx="4" fill="#1E293B" stroke="#94A3B8" stroke-width="4"/>
  <line x1="250" y1="290" x2="250" y2="370" stroke="#64748B" stroke-width="6"/>
  <line x1="280" y1="290" x2="280" y2="370" stroke="#64748B" stroke-width="6"/>
  <line x1="310" y1="290" x2="310" y2="370" stroke="#64748B" stroke-width="6"/>
  <line x1="340" y1="290" x2="340" y2="370" stroke="#64748B" stroke-width="6"/>
  <path d="M180,270 Q250,220 380,260 Q450,290 350,300 Q220,310 180,270 Z" fill="#0284C7" opacity="0.7"/>
  <path d="M120,285 Q200,260 270,280 Q210,310 120,285 Z" fill="#0369A1" opacity="0.6"/>
  <text x="30" y="45" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#FFFFFF">Varale Gaothan - Drain Overflow</text>
  <rect x="30" y="60" width="140" height="24" rx="4" fill="#0284C7"/>
  <text x="40" y="77" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#FFFFFF">DRAINAGE ISSUE</text>
</svg>''',
    'broken_road1.svg': '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="100%" height="100%">
  <rect width="600" height="400" fill="#334155"/>
  <polygon points="0,0 600,0 600,240 500,220 400,270 320,230 200,280 80,240 0,260" fill="#1E293B"/>
  <polygon points="0,260 80,240 200,280 320,230 400,270 500,220 600,240 600,400 0,400" fill="#78350F"/>
  <path d="M0,260 L80,240 L200,280 L320,230 L400,270 L500,220 L600,240" stroke="#F59E0B" stroke-width="5" fill="none"/>
  <circle cx="150" cy="320" r="12" fill="#92400E"/>
  <circle cx="270" cy="310" r="15" fill="#92400E"/>
  <circle cx="370" cy="330" r="10" fill="#92400E"/>
  <text x="30" y="45" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#FFFFFF">ZP Primary School Road - Edge Caved In</text>
  <rect x="30" y="60" width="130" height="24" rx="4" fill="#DC2626"/>
  <text x="40" y="77" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#FFFFFF">BROKEN ROAD</text>
</svg>'''
}

os.makedirs('uploads', exist_ok=True)
os.makedirs(os.path.join('static', 'images'), exist_ok=True)

for name, content in images.items():
    with open(os.path.join('uploads', name), 'w', encoding='utf-8') as f:
        f.write(content)
    with open(os.path.join('static', 'images', name), 'w', encoding='utf-8') as f:
        f.write(content)

print('Sample SVG images successfully generated in uploads/ and static/images/')

