import { NextRequest, NextResponse } from 'next/server'

const CSV_TEMPLATE = `title,description,sku,ean,brand,category,price,supplier_price,stock,weight,warranty_months,image1,image2,image3,image4,image5,spec_key1,spec_val1,spec_key2,spec_val2,spec_key3,spec_val3
"Statie Radio CB Cobra 29 LX EU","Statie radio CB cu afisaj LCD color, ANL, RF Gain, SWR metru incorporat","COBRA-29LX","5022693999936","Cobra","Statii Radio/Statii CB","459.99","320.00","15","1.2","24","imagini/cobra-29lx-1.jpg","imagini/cobra-29lx-2.jpg","","","","Frecventa","26.965 - 27.405 MHz","Putere","4W AM / 12W FM","Canale","40"
"Antena CB Sirio Turbo 3000 PL","Antena CB din fibra de sticla, castig 6.5dBi, lungime 195cm","SIRIO-T3000","8016412003487","Sirio","Antene/Antene CB","189.99","130.00","25","0.8","12","imagini/sirio-t3000-1.jpg","","","","","Lungime","195 cm","Castig","6.5 dBi","Impedanta","50 Ohm"
"Alimentator PNI Jetfon 30A","Alimentator stabilizat 13.8V 30A pentru statii radio","JETFON-30A","8436039302456","Jetfon","Accesorii/Alimentatoare","249.99","175.00","10","3.5","24","https://example.com/jetfon-30a.jpg","","","","","Tensiune iesire","13.8V DC","Curent maxim","30A","Protectii","Scurtcircuit, Supratensiune"
`

const XML_TEMPLATE = `<?xml version="1.0" encoding="UTF-8"?>
<products>
  <product>
    <title>Statie Radio CB Cobra 29 LX EU</title>
    <description>Statie radio CB cu afisaj LCD color, ANL, RF Gain, SWR metru incorporat</description>
    <sku>COBRA-29LX</sku>
    <ean>5022693999936</ean>
    <brand>Cobra</brand>
    <category>Statii Radio/Statii CB</category>
    <price>459.99</price>
    <supplier_price>320.00</supplier_price>
    <stock>15</stock>
    <weight>1.2</weight>
    <warranty_months>24</warranty_months>
    <images>
      <image>imagini/cobra-29lx-1.jpg</image>
      <image>imagini/cobra-29lx-2.jpg</image>
    </images>
    <specifications>
      <spec key="Frecventa">26.965 - 27.405 MHz</spec>
      <spec key="Putere">4W AM / 12W FM</spec>
      <spec key="Canale">40</spec>
    </specifications>
  </product>
  <product>
    <title>Antena CB Sirio Turbo 3000 PL</title>
    <description>Antena CB din fibra de sticla, castig 6.5dBi, lungime 195cm</description>
    <sku>SIRIO-T3000</sku>
    <ean>8016412003487</ean>
    <brand>Sirio</brand>
    <category>Antene/Antene CB</category>
    <price>189.99</price>
    <supplier_price>130.00</supplier_price>
    <stock>25</stock>
    <weight>0.8</weight>
    <warranty_months>12</warranty_months>
    <images>
      <image>imagini/sirio-t3000-1.jpg</image>
    </images>
    <specifications>
      <spec key="Lungime">195 cm</spec>
      <spec key="Castig">6.5 dBi</spec>
      <spec key="Impedanta">50 Ohm</spec>
    </specifications>
  </product>
</products>
`

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') || 'csv'

  if (format === 'xml') {
    return new NextResponse(XML_TEMPLATE, {
      headers: {
        'Content-Type': 'application/xml',
        'Content-Disposition': 'attachment; filename="template_produse.xml"',
      },
    })
  }

  return new NextResponse(CSV_TEMPLATE, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="template_produse.csv"',
    },
  })
}
