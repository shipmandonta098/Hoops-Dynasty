"""Generate the 12 franchise-preset logos as SVG (primary badge + secondary mark).

Original vector artwork drawn for Hoops Dynasty in the flat outlined style of the
existing atlases. Run from the repo root:
  python3 dev/franchise-presets/build-logos.py
  node dev/franchise-presets/render-logos.cjs   # rasterizes atlas + secondary PNGs
"""
import math, pathlib

OUT = '#12161D'          # shared dark outline
ORANGE = '#F08A3A'       # neutral basketball leather used across marks
SEAM = '#2A1A10'
DEST = pathlib.Path('dist/preset-logos')


def ball(cx, cy, r, fill=ORANGE, seam=SEAM, outline=OUT, ow=None):
    ow = ow if ow is not None else max(6, r * .09)
    sw = max(3, r * .075)
    k = r * .62
    return (f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}" stroke="{outline}" stroke-width="{ow}"/>'
            f'<g fill="none" stroke="{seam}" stroke-width="{sw}" stroke-linecap="round">'
            f'<path d="M{cx} {cy-r}V{cy+r}M{cx-r} {cy}H{cx+r}"/>'
            f'<path d="M{cx-k} {cy-r*.79}Q{cx-r*.18} {cy} {cx-k} {cy+r*.79}"/>'
            f'<path d="M{cx+k} {cy-r*.79}Q{cx+r*.18} {cy} {cx+k} {cy+r*.79}"/></g>')


def star(cx, cy, r, fill, outline=OUT, ow=5, points=5, inner=.45, rot=-90):
    pts = []
    for i in range(points * 2):
        a = math.radians(rot + i * 180 / points)
        rr = r if i % 2 == 0 else r * inner
        pts.append(f'{cx+rr*math.cos(a):.1f},{cy+rr*math.sin(a):.1f}')
    return f'<polygon points="{" ".join(pts)}" fill="{fill}" stroke="{outline}" stroke-width="{ow}" stroke-linejoin="round"/>'


def poly(points, fill, ow=10, outline=OUT, extra=''):
    return f'<polygon points="{points}" fill="{fill}" stroke="{outline}" stroke-width="{ow}" stroke-linejoin="round" {extra}/>'


def svg(body, defs=''):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">'
            f'{"<defs>"+defs+"</defs>" if defs else ""}{body}</svg>')


# Each logo returns (primary_body, secondary_body[, defs]).

def anaheim():
    navy, orange, silver = '#14213D', '#F26B21', '#B9C2CC'
    def arrow(dx=0, dy=0):
        return (f'<g transform="translate({dx} {dy}) rotate(-35 256 256)">'
             # speed streaks
             f'<g stroke="{OUT}" stroke-width="9" stroke-linecap="round"><path d="M96 300H160M110 336H166M126 372H164"/></g>'
             f'<g stroke="{orange}" stroke-width="5" stroke-linecap="round"><path d="M96 300H160M110 336H166M126 372H164"/></g>'
             # shaft
             f'<rect x="128" y="243" width="282" height="26" rx="6" fill="{silver}" stroke="{OUT}" stroke-width="9"/>'
             # fletching
             f'{poly("128,256 98,212 160,212 186,256", orange, 9)}{poly("128,256 98,300 160,300 186,256", navy, 9)}'
             # head
             f'{poly("400,218 462,256 400,294 414,256", silver, 10)}'
             f'</g>')
    primary = (f'<circle cx="256" cy="256" r="236" fill="{navy}" stroke="{OUT}" stroke-width="12"/>'
               f'<circle cx="256" cy="256" r="212" fill="none" stroke="{silver}" stroke-width="10"/>'
               f'{ball(256, 256, 118, orange)}{arrow()}')
    secondary = f'{ball(250, 262, 150, orange)}{arrow()}'
    return primary, secondary


def buffalo():
    ice, navy, snow = '#8FD3F4', '#13294B', '#F4F8FB'
    def flake(r, w, color, outline=True):
        arms = ''
        for i in range(6):
            a = i * 60
            arms += (f'<g transform="rotate({a} 256 256)"><path d="M256 256V{256-r}" />'
                     f'<path d="M256 {256-r*.62}l{-r*.2} {-r*.2}M256 {256-r*.62}l{r*.2} {-r*.2}"/>'
                     f'<path d="M256 {256-r*.86}l{-r*.12} {-r*.12}M256 {256-r*.86}l{r*.12} {-r*.12}"/></g>')
        out = ''
        if outline:
            out = f'<g stroke="{OUT}" stroke-width="{w+12}" stroke-linecap="round" fill="none">{arms}</g>'
        return out + f'<g stroke="{color}" stroke-width="{w}" stroke-linecap="round" fill="none">{arms}</g>'
    hexagon = ' '.join(f'{256+236*math.cos(math.radians(a)):.1f},{256+236*math.sin(math.radians(a)):.1f}' for a in range(-90, 270, 60))
    swirl = (f'<g fill="none" stroke-linecap="round"><path d="M110 330Q200 380 300 340T430 300" stroke="{OUT}" stroke-width="22"/>'
             f'<path d="M110 330Q200 380 300 340T430 300" stroke="{snow}" stroke-width="10"/>'
             f'<path d="M90 190Q170 150 250 175T400 160" stroke="{OUT}" stroke-width="18"/>'
             f'<path d="M90 190Q170 150 250 175T400 160" stroke="{snow}" stroke-width="7"/></g>')
    primary = poly(hexagon, navy, 12) + flake(200, 16, ice) + ball(256, 256, 100, ORANGE) + swirl
    secondary = flake(232, 20, ice) + ball(256, 256, 116, ice, seam=navy)
    return primary, secondary


def calgary():
    crimson, black, gold = '#B5123A', '#141414', '#D9A940'
    shield = 'M256 24L460 84V250Q460 400 256 490Q52 400 52 250V84Z'
    horns = (f'<path d="M150 170Q70 150 60 70Q120 120 190 128Z" fill="{gold}" stroke="{OUT}" stroke-width="10" stroke-linejoin="round"/>'
             f'<path d="M362 170Q442 150 452 70Q392 120 322 128Z" fill="{gold}" stroke="{OUT}" stroke-width="10" stroke-linejoin="round"/>')
    # horseshoe: thick U around the ball, nail holes
    shoe = (f'<path d="M150 420V280A106 106 0 0 1 362 280V420" fill="none" stroke="{OUT}" stroke-width="64" stroke-linecap="round"/>'
            f'<path d="M150 420V280A106 106 0 0 1 362 280V420" fill="none" stroke="{gold}" stroke-width="44" stroke-linecap="round"/>'
            + ''.join(f'<circle cx="{x}" cy="{y}" r="6" fill="{black}"/>' for x, y in [(150, 330), (150, 390), (362, 330), (362, 390), (186, 196), (326, 196)]))
    primary = (f'<path d="{shield}" fill="{black}" stroke="{OUT}" stroke-width="12" stroke-linejoin="round"/>'
               f'<path d="M256 50L436 102V250Q436 384 256 464Q76 384 76 250V102Z" fill="{crimson}"/>'
               f'{horns}{shoe}{ball(256, 290, 84, ORANGE)}{star(256, 92, 26, gold)}')
    secondary = horns.replace('170', '200').replace('128', '158') + shoe + ball(256, 290, 84, crimson, seam=black)
    return primary, secondary


def cincinnati():
    royal, gold, white = '#1F4FB4', '#E2B13C', '#F7F7F2'
    crown = (f'<path d="M136 214L120 110L196 160L256 84L316 160L392 110L376 214Z" fill="{gold}" stroke="{OUT}" stroke-width="11" stroke-linejoin="round"/>'
             f'<rect x="132" y="206" width="248" height="34" rx="6" fill="{gold}" stroke="{OUT}" stroke-width="10"/>'
             + ''.join(f'<circle cx="{x}" cy="{y}" r="13" fill="{white}" stroke="{OUT}" stroke-width="6"/>' for x, y in [(120, 106), (256, 80), (392, 106)])
             + ''.join(f'<circle cx="{x}" cy="223" r="8" fill="{royal}"/>' for x in (180, 256, 332)))
    primary = (f'<circle cx="256" cy="256" r="236" fill="{white}" stroke="{OUT}" stroke-width="12"/>'
               f'<circle cx="256" cy="256" r="214" fill="{royal}" stroke="{gold}" stroke-width="10"/>'
               f'{ball(256, 330, 112, ORANGE)}{crown}')
    secondary = f'{ball(256, 330, 140, royal, seam=gold)}{crown}'
    return primary, secondary


def green_bay():
    green, brown, cream = '#1E5B3A', '#6B4426', '#EFE3C2'
    steel = '#C9D0D6'
    def axe(flip):
        t = f'translate(512 0) scale(-1 1)' if flip else ''
        return (f'<g transform="{t}"><g transform="rotate(-40 256 256)">'
                f'<rect x="244" y="66" width="24" height="380" rx="10" fill="{brown}" stroke="{OUT}" stroke-width="9"/>'
                f'<path d="M262 84Q378 50 404 132Q378 206 262 166Z" fill="{steel}" stroke="{OUT}" stroke-width="10" stroke-linejoin="round"/>'
                f'<path d="M262 84Q292 124 262 166" fill="none" stroke="{OUT}" stroke-width="6"/>'
                f'</g></g>')
    trees = ''.join(poly(f'{x},{y} {x-30},{y+70} {x+30},{y+70}', '#14402A', 7) for x, y in [(120, 300), (170, 280), (342, 280), (392, 300)])
    primary = (f'<circle cx="256" cy="256" r="236" fill="{cream}" stroke="{OUT}" stroke-width="12"/>'
               f'<circle cx="256" cy="256" r="212" fill="{green}"/>'
               f'{trees}{axe(False)}{axe(True)}{ball(256, 270, 92, ORANGE)}'
               f'<path d="M60 360H452" stroke="{cream}" stroke-width="0"/>')
    secondary = f'{axe(False)}{axe(True)}{ball(256, 270, 112, cream, seam=green)}'
    return primary, secondary


def nashville():
    purple, gold, black = '#5B2C83', '#E6B84A', '#121212'
    pick = 'M256 486C150 400 52 260 60 150C66 70 150 30 256 30C362 30 446 70 452 150C460 260 362 400 256 486Z'
    bars = [70, 120, 170, 120, 200, 140, 90, 150, 70]
    eq = ''
    for i, h in enumerate(bars):
        x = 96 + i * 40
        eq += f'<rect x="{x-11}" y="{246-h/2}" width="22" height="{h}" rx="11" fill="{gold}" stroke="{OUT}" stroke-width="7"/>'
    primary = (f'<path d="{pick}" fill="{black}" stroke="{OUT}" stroke-width="12"/>'
               f'<path d="M256 456C162 380 82 256 88 156C94 92 164 58 256 58C348 58 418 92 424 156C430 256 350 380 256 456Z" fill="{purple}"/>'
               f'{ball(256, 246, 118, ORANGE)}{eq}')
    secondary = f'{ball(256, 256, 150, purple, seam=black)}{eq.replace("246", "256")}'
    return primary, secondary


def newark():
    steel, red, black = '#6E7781', '#C8322B', '#16181B'
    octagon = ' '.join(f'{256+238*math.cos(math.radians(a)):.1f},{256+238*math.sin(math.radians(a)):.1f}' for a in range(-112, 248, 45))
    inner = ' '.join(f'{256+204*math.cos(math.radians(a)):.1f},{256+204*math.sin(math.radians(a)):.1f}' for a in range(-112, 248, 45))
    rivets = ''.join(f'<circle cx="{256+222*math.cos(math.radians(a)):.1f}" cy="{256+222*math.sin(math.radians(a)):.1f}" r="8" fill="#AAB2BA" stroke="{OUT}" stroke-width="4"/>' for a in range(-90, 270, 45))
    beam = (f'<path d="M70 196H442V226H404V286H442V316H70V286H108V226H70Z" fill="#AAB2BA" stroke="{OUT}" stroke-width="10" stroke-linejoin="round"/>'
            + ''.join(f'<circle cx="{x}" cy="{y}" r="6" fill="{black}"/>' for x in (130, 382) for y in (240, 272)))
    primary = poly(octagon, black, 12) + poly(inner, steel, 0) + rivets + ball(256, 256, 124, red, seam=black) + beam
    secondary = ball(256, 256, 160, red, seam=black) + beam.replace('M70', 'M40').replace('H442', 'H472')
    return primary, secondary


def ottawa():
    red, black, silver = '#C8102E', '#111111', '#C3C8CE'
    tower = (f'<path d="M222 300V150L256 64L290 150V300Z" fill="{silver}" stroke="{OUT}" stroke-width="10" stroke-linejoin="round"/>'
             f'<circle cx="256" cy="176" r="18" fill="{black}" stroke="{OUT}" stroke-width="4"/>'
             f'<path d="M256 166V176L264 182" stroke="{silver}" stroke-width="4" fill="none" stroke-linecap="round"/>'
             f'<rect x="240" y="210" width="32" height="50" rx="14" fill="{black}"/>')
    primary = (f'<path d="M256 22L470 100V262Q470 410 256 492Q42 410 42 262V100Z" fill="{black}" stroke="{OUT}" stroke-width="12" stroke-linejoin="round"/>'
               f'<path d="M256 50L444 118V262Q444 390 256 464Q68 390 68 262V118Z" fill="{red}"/>'
               f'<path d="M96 150L256 98L416 150" fill="none" stroke="{silver}" stroke-width="12" stroke-linecap="round"/>'
               f'{tower}{ball(256, 352, 92, ORANGE)}')
    secondary = tower.replace('M222 300', 'M222 330').replace('290 150V300', '290 150V330') + ball(256, 360, 112, red, seam=black)
    return primary, secondary


def san_jose():
    teal, charcoal, blue = '#13A3A0', '#2C3136', '#2E8BFF'
    hexagon = ' '.join(f'{256+236*math.cos(math.radians(a)):.1f},{256+236*math.sin(math.radians(a)):.1f}' for a in range(0, 360, 60))
    traces_d = ('M256 132V60H330M256 380V452H180M132 256H60V190M380 256H452V320'
                'M168 168L120 120H70M344 344L392 392H442M344 168L392 120V76M168 344L120 392V436')
    nodes = [(330, 60), (180, 452), (60, 190), (452, 320), (70, 120), (442, 392), (392, 76), (120, 436)]
    traces = (f'<g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="{traces_d}" stroke="{OUT}" stroke-width="22"/>'
              f'<path d="{traces_d}" stroke="{blue}" stroke-width="10"/></g>'
              + ''.join(f'<circle cx="{x}" cy="{y}" r="15" fill="{blue}" stroke="{OUT}" stroke-width="8"/>' for x, y in nodes))
    chip = f'<rect x="132" y="132" width="248" height="248" rx="34" fill="{charcoal}" stroke="{OUT}" stroke-width="10"/>'
    pins = ''.join(f'<rect x="{x}" y="112" width="16" height="26" rx="4" fill="{teal}" stroke="{OUT}" stroke-width="4"/>'
                   f'<rect x="{x}" y="374" width="16" height="26" rx="4" fill="{teal}" stroke="{OUT}" stroke-width="4"/>' for x in (176, 216, 280, 320))
    primary = poly(hexagon, charcoal, 12) + traces + pins + chip + ball(256, 256, 98, teal, seam=charcoal)
    secondary = traces + pins + chip + ball(256, 256, 98, teal, seam=charcoal)
    return primary, secondary


def st_louis():
    blue, silver, gold = '#1D4E89', '#BFC7D0', '#D4A73A'
    # the Arch doubles as the archer's bow, with the bowstring drawn to an arrow
    arch = (f'<path d="M86 448Q256 -150 426 448" fill="none" stroke="{OUT}" stroke-width="44" stroke-linecap="round"/>'
            f'<path d="M86 448Q256 -150 426 448" fill="none" stroke="{silver}" stroke-width="26" stroke-linecap="round"/>')
    string = f'<path d="M86 448L256 380L426 448" fill="none" stroke="{gold}" stroke-width="7" stroke-linejoin="round"/>'
    arrow = (f'<rect x="246" y="96" width="20" height="290" rx="5" fill="{gold}" stroke="{OUT}" stroke-width="8"/>'
             f'{poly("256,40 288,102 256,92 224,102", silver, 9)}'
             f'{poly("256,384 230,420 230,368 256,350", gold, 7)}{poly("256,384 282,420 282,368 256,350", gold, 7)}')
    primary = (f'<circle cx="256" cy="256" r="236" fill="{blue}" stroke="{OUT}" stroke-width="12"/>'
               f'<circle cx="256" cy="256" r="214" fill="none" stroke="{gold}" stroke-width="8"/>'
               f'{arch}{string}{ball(256, 270, 86, ORANGE)}{arrow}')
    secondary = arch + string + ball(256, 270, 96, blue, seam=silver) + arrow
    return primary, secondary


def tampa():
    aqua, navy, coral = '#2EC4C6', '#0F2A4A', '#FF7F66'
    trident = (f'<g stroke="{OUT}" stroke-width="10" stroke-linejoin="round">'
               f'<rect x="242" y="130" width="28" height="350" rx="8" fill="{aqua}"/>'
               f'<path d="M150 70L174 160Q190 200 256 206Q322 200 338 160L362 70L326 116L316 166Q300 182 256 184Q212 182 196 166L186 116Z" fill="{aqua}"/>'
               f'{poly("256,30 286,96 266,92 266,150 246,150 246,92 226,96", aqua, 10)}</g>')
    waves = (f'<path d="M40 404Q90 370 140 404T240 404T340 404T440 404T480 404V470H40Z" fill="{coral}" stroke="{OUT}" stroke-width="10" stroke-linejoin="round"/>')
    primary = (f'<circle cx="256" cy="256" r="236" fill="{navy}" stroke="{OUT}" stroke-width="12"/>'
               f'<clipPath id="tpa-clip"><circle cx="256" cy="256" r="224"/></clipPath>'
               f'<g clip-path="url(#tpa-clip)">{waves}</g>{ball(256, 300, 104, ORANGE)}{trident}')
    secondary = ball(256, 300, 116, coral, seam=navy) + trident
    return primary, secondary


def winnipeg():
    midnight, violet, ice = '#121A3A', '#7B5CD6', '#E8F4FA'
    defs = (f'<linearGradient id="wpg-a" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3FE0B5"/><stop offset=".55" stop-color="{violet}"/><stop offset="1" stop-color="#C9A8FF"/></linearGradient>'
            f'<linearGradient id="wpg-b" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="{violet}"/><stop offset="1" stop-color="{ice}"/></linearGradient>')
    ribbons = (f'<path d="M58 250Q150 110 256 170T454 120L454 170Q350 216 256 220T70 300Z" fill="url(#wpg-a)" stroke="{OUT}" stroke-width="9" stroke-linejoin="round"/>'
               f'<path d="M80 320Q170 220 270 250T440 210L440 246Q350 290 266 286T96 352Z" fill="url(#wpg-b)" stroke="{OUT}" stroke-width="8" stroke-linejoin="round"/>')
    stars = ''.join(star(x, y, r, ice, ow=3, points=4, inner=.35) for x, y, r in [(150, 110, 16), (360, 80, 12), (400, 230, 10), (110, 200, 9)])
    primary = (f'<circle cx="256" cy="256" r="236" fill="{ice}" stroke="{OUT}" stroke-width="12"/>'
               f'<circle cx="256" cy="256" r="214" fill="{midnight}"/>'
               f'<clipPath id="wpg-clip"><circle cx="256" cy="256" r="214"/></clipPath>'
               f'<g clip-path="url(#wpg-clip)">{stars}{ribbons}</g>{ball(256, 352, 92, ORANGE)}')
    secondary = ribbons + ball(256, 340, 112, violet, seam=midnight) + stars
    return primary, secondary, defs


LOGOS = [('ANA', anaheim), ('BUF', buffalo), ('CGY', calgary), ('CIN', cincinnati), ('GBY', green_bay), ('NSH', nashville),
         ('NWK', newark), ('OTT', ottawa), ('SJO', san_jose), ('STL', st_louis), ('TPA', tampa), ('WPG', winnipeg)]

if __name__ == '__main__':
    DEST.mkdir(parents=True, exist_ok=True)
    for abbr, fn in LOGOS:
        out = fn()
        primary, secondary = out[0], out[1]
        defs = out[2] if len(out) > 2 else ''
        (DEST / f'{abbr}.svg').write_text(svg(primary, defs))
        (DEST / f'{abbr}-secondary.svg').write_text(svg(secondary, defs.replace('wpg-a', 'wpg-sa').replace('wpg-b', 'wpg-sb')).replace('url(#wpg-a)', 'url(#wpg-sa)').replace('url(#wpg-b)', 'url(#wpg-sb)'))
    print('wrote', len(LOGOS) * 2, 'SVG files to', DEST)
