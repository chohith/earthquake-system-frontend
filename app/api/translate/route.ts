import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text');
  const target = searchParams.get('target');

  if (!text || !target || target === 'en' || target.startsWith('en')) {
    return NextResponse.json({ translatedText: text });
  }

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Translation failed');
    
    const data = await response.json();
    let translatedText = '';
    if (data && data[0]) {
      data[0].forEach((item: any) => {
        if (item[0]) translatedText += item[0];
      });
    }

    return NextResponse.json({ translatedText: translatedText || text }, { headers: { 'Cache-Control': 'public, s-maxage=86400' } });
  } catch (error) {
    return NextResponse.json({ translatedText: text });
  }
}

export async function POST(req: Request) {
  try {
    const { texts, target } = await req.json();
    if (!texts || !target || target.startsWith('en')) {
      return NextResponse.json({ translatedTexts: texts });
    }

    // Safely join multiple geo locations using a safe delimiter ' || '
    const payload = texts.join(' || ');
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${target}&dt=t&q=${encodeURIComponent(payload)}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Translation failed');
    
    const data = await response.json();
    let rawTranslation = '';
    if (data && data[0]) {
      data[0].forEach((item: any) => {
        if (item[0]) rawTranslation += item[0];
      });
    }

    // Split back by our delimiter, trimming excess spaces translation services might add
    const mappedArray = rawTranslation.split('||').map(t => t.replace(/\|/g, '').trim());
    return NextResponse.json({ translatedTexts: mappedArray }, { headers: { 'Cache-Control': 'public, s-maxage=86400' } });
  } catch (err) {
    return NextResponse.json({ translatedTexts: [] });
  }
}
