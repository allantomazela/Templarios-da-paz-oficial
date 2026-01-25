import { ShieldCheck, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import useSiteSettingsStore from '@/stores/useSiteSettingsStore'
import type { Event, VisitorAttendance } from '@/lib/data'

export function VisitorCertificateDocument({
  visitor,
  event,
  venerableMaster,
  chancellor,
}: VisitorCertificateDocumentProps) {
  const { logoUrl, contact, siteTitle } = useSiteSettingsStore()

  return (
    <div className="bg-white text-black min-h-[297mm] w-[210mm] mx-auto p-16 print:p-12 flex flex-col justify-between relative">
      {/* Bordas decorativas */}
      <div className="absolute inset-0 border-4 border-black pointer-events-none" />
      <div className="absolute inset-4 border border-gray-400 print:border-gray-600 pointer-events-none" />

      {/* Cabeçalho com Logo e Informações */}
      <div className="text-center mb-8 print:mb-6 relative z-10">
        <div className="flex justify-center mb-6 print:mb-4">
          {logoUrl ? (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-amber-100 print:from-transparent print:to-transparent rounded-full blur-sm print:blur-0" />
              <img
                src={logoUrl}
                alt="Logo da Loja"
                className="h-28 w-28 print:h-24 print:w-24 object-contain relative z-10 drop-shadow-lg print:drop-shadow-none"
              />
            </div>
          ) : (
            <div className="h-28 w-28 print:h-24 print:w-24 flex items-center justify-center border-4 border-black rounded-full bg-gradient-to-br from-amber-50 to-amber-100 print:from-white print:to-white shadow-lg print:shadow-none">
              <ShieldCheck className="h-20 w-20 print:h-16 print:w-16 text-black" />
            </div>
          )}
        </div>

        <h1 className="text-3xl print:text-2xl font-bold text-black mb-2 print:mb-1 tracking-tight">
          {siteTitle || 'Templários da Paz'}
        </h1>

        {contact.address && (
          <div className="flex items-center justify-center gap-2 text-sm print:text-xs text-black mb-4 print:mb-2">
            <MapPin className="h-4 w-4 print:h-3 print:w-3" />
            <span>
              {contact.address}
              {contact.city && `, ${contact.city}`}
              {contact.zip && ` - CEP: ${contact.zip}`}
            </span>
          </div>
        )}
      </div>

      {/* Título do Certificado */}
      <div className="text-center mb-12 print:mb-8 relative z-10">
        <div className="relative mb-6 print:mb-4">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 print:w-24 h-0.5 print:h-px bg-gradient-to-r from-transparent via-black to-transparent" />

          <div className="border-t-2 border-b-2 border-black py-5 print:py-4 px-8 print:px-6 bg-gradient-to-b from-amber-50/50 to-transparent print:from-transparent print:to-transparent">
            <h2 className="text-4xl print:text-3xl font-bold text-black uppercase tracking-wider">
              Certificado de Presença
            </h2>
          </div>

          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 print:w-24 h-0.5 print:h-px bg-gradient-to-r from-transparent via-black to-transparent" />
        </div>

        <div className="max-w-3xl mx-auto">
          <p className="text-lg print:text-base text-black leading-relaxed">
            Certificamos que o{' '}
            <strong className="font-bold text-black">{visitor.name}</strong>, no
            Grau de{' '}
            <strong className="font-bold text-black">{visitor.degree}</strong>,
            da{' '}
            <strong className="font-bold text-black">
              {visitor.lodge} Nº {visitor.lodgeNumber}
            </strong>
            , filiada à{' '}
            <strong className="font-bold text-black">{visitor.obedience}</strong>
            {visitor.masonicNumber && (
              <>
                , portador do Registro Maçônico Nº{' '}
                <strong className="font-bold text-black">
                  {visitor.masonicNumber}
                </strong>
              </>
            )}
            , esteve presente na sessão realizada em{' '}
            <strong className="font-bold text-black">
              {format(new Date(event.date), "dd 'de' MMMM 'de' yyyy", {
                locale: ptBR,
              })}
            </strong>
            , na qualidade de{' '}
            <strong className="font-bold text-black">Visitante</strong>.
          </p>
        </div>
      </div>

      {/* Informações do Evento */}
      <div className="bg-gradient-to-br from-amber-50/30 to-amber-100/20 print:from-gray-50 print:to-gray-100 border-2 border-gray-300 print:border-black rounded-lg p-6 print:p-4 mb-12 print:mb-8 relative z-10 shadow-sm print:shadow-none">
        <div className="flex items-center gap-2 mb-4 print:mb-2">
          <div className="h-1 w-12 print:h-0.5 print:w-8 bg-black" />
          <h3 className="text-lg print:text-base font-bold text-black uppercase tracking-wide">
            Detalhes da Sessão
          </h3>
          <div className="flex-1 h-1 print:h-0.5 bg-black" />
        </div>
        <div className="grid grid-cols-1 gap-3 print:gap-2 text-sm print:text-xs">
          <div className="flex items-start gap-2">
            <span className="font-bold text-black min-w-[120px] print:min-w-[100px]">
              Tipo de Sessão:
            </span>
            <span className="text-black">{event.type}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-black min-w-[120px] print:min-w-[100px]">
              Título:
            </span>
            <span className="text-black">{event.title}</span>
          </div>
          {event.description && (
            <div className="flex items-start gap-2">
              <span className="font-bold text-black min-w-[120px] print:min-w-[100px]">
                Descrição:
              </span>
              <span className="text-black">{event.description}</span>
            </div>
          )}
        </div>
      </div>

      {/* Assinaturas */}
      <div className="mt-auto relative z-10">
        <div className="grid grid-cols-2 gap-16 print:gap-12 mt-16 print:mt-12">
          <div className="text-center">
            <div className="relative">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 print:w-16 h-0.5 print:h-px bg-gradient-to-r from-transparent via-gray-400 print:via-gray-600 to-transparent" />
              <div className="border-t-2 border-black pt-4 print:pt-3 mt-24 print:mt-20 min-h-[80px] print:min-h-[60px]">
                <p className="text-base print:text-sm font-bold text-black mb-2 print:mb-1">
                  {venerableMaster}
                </p>
                <p className="text-sm print:text-xs text-black font-semibold uppercase tracking-wide">
                  Venerável Mestre
                </p>
              </div>
            </div>
          </div>
          <div className="text-center">
            <div className="relative">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 print:w-16 h-0.5 print:h-px bg-gradient-to-r from-transparent via-gray-400 print:via-gray-600 to-transparent" />
              <div className="border-t-2 border-black pt-4 print:pt-3 mt-24 print:mt-20 min-h-[80px] print:min-h-[60px]">
                <p className="text-base print:text-sm font-bold text-black mb-2 print:mb-1">
                  {chancellor}
                </p>
                <p className="text-sm print:text-xs text-black font-semibold uppercase tracking-wide">
                  Chanceler
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé */}
      <div className="mt-8 print:mt-6 pt-4 print:pt-3 border-t text-center text-xs print:text-[10px] text-gray-600 print:text-black relative z-10">
        <p>Documento gerado eletronicamente pelo sistema Templários da Paz</p>
        <p className="mt-1 print:mt-0.5">
          Data de emissão:{' '}
          {format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
            locale: ptBR,
          })}
        </p>
      </div>
    </div>
  )
}

interface VisitorCertificateDocumentProps {
  visitor: VisitorAttendance
  event: Event
  venerableMaster: string
  chancellor: string
}
