"""
Generează vocea povestitorului pentru cartea cu povestea (assets/voce/pagina-N.mp3).

Vocea implicită e un bunic: o voce neuronală matură (edge-tts) prelucrată cu
ffmpeg ca să sune mai bătrână — ton și timbru coborâte împreună, un tremur
ușor, sunet cald.

    python -m pip install edge-tts imageio-ffmpeg
    python tools/genereaza_voce.py            # bunicul (implicit)
    python tools/genereaza_voce.py --bunica   # bunica (vocea românească Alina)

Textele de aici sunt cele din js/main.js (PAGES), scrise „pentru ureche”:
pauze marcate cu virgule/puncte și cuvinte străine scrise cum se pronunță.
Dacă schimbi povestea în joc, schimb-o și aici, apoi rulează din nou.

Deocamdată jocul NU folosește aceste înregistrări (butonul de citire din carte
a fost scos); scriptul rămâne aici dacă vocea va fi adăugată din nou.
"""
import asyncio
import pathlib
import subprocess
import sys
import tempfile

import edge_tts
import imageio_ffmpeg

PAGINI = [
    "Era noaptea de Ajun... Moș Crăciun își pregătea sania cu daruri. "
    "Dar ce să vezi? Un vânt puternic suflase toate stelele de pe cer!",

    "Fără stele renii nu mai găseau drumul spre casele copiilor... ... "
    "„Cine mă ajută să pun stelele la loc pe cer?”, a întrebat Moș Crăciun.",

    "Eu te voi ajuta... a strigat Bubu... ... Moș Crăciun i-a dat căciulița lui roșie, "
    "și sania cea mică, trasă de doi reni... Unul dintre ei are nasul roșu... și luminos!",

    "Copii, ajutați-o pe Bubu! Mișcați mausul, iar sania zboară după el... "
    "Puneți stelele la loc pe cer, adunați cadourile, clopoțeii, globurile și beculețele, "
    "apoi duceți darurile la case... La sfârșit va apărea Steaua cea mare de Crăciun!",
]

# Bunic: ton + timbru mai jos (asetrate), viteză compensată puțin, tremur ușor
# (vibrato), sunet cald (lowpass) și o cameră mică (aecho).
BATRAN = ("asetrate=24000*0.88,aresample=24000,atempo=1.04,"
          "vibrato=f=5.5:d=0.05,lowpass=f=6500,aecho=0.8:0.5:40:0.12,volume=1.4")

VOCI = {
    "bunic": dict(tts=dict(voice="it-IT-GiuseppeMultilingualNeural", rate="-8%"), filtru=BATRAN),
    "bunica": dict(tts=dict(voice="ro-RO-AlinaNeural", rate="-22%", pitch="-12Hz"), filtru=None),
}


async def main():
    voce = VOCI["bunica" if "--bunica" in sys.argv else "bunic"]
    out = pathlib.Path(__file__).resolve().parent.parent / "assets" / "voce"
    out.mkdir(parents=True, exist_ok=True)
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    with tempfile.TemporaryDirectory() as tmp:
        for i, text in enumerate(PAGINI, 1):
            f = out / f"pagina-{i}.mp3"
            brut = pathlib.Path(tmp) / f"brut-{i}.mp3"
            await edge_tts.Communicate(text, **voce["tts"]).save(str(brut if voce["filtru"] else f))
            if voce["filtru"]:
                subprocess.run([ffmpeg, "-loglevel", "error", "-y", "-i", str(brut),
                                "-af", voce["filtru"], "-b:a", "64k", str(f)], check=True)
            print(f, f.stat().st_size // 1024, "KB")


asyncio.run(main())
