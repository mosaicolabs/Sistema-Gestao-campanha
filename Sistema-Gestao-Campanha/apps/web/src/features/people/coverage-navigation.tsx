import { MapPin, UsersThree } from '@phosphor-icons/react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import type { CoverageTreeRegion } from '@/lib/types'

type AllianceItem = { id: string; name: string }

type Props = {
  regions: CoverageTreeRegion[]
  selectedCityId?: string
  selectedAllianceId?: string
  allianceItems: AllianceItem[]
  onSelectCity: (cityId: string) => void
  onSelectAlliance: (allianceId: string) => void
}

export function CoverageNavigation({ regions, selectedCityId, selectedAllianceId, allianceItems, onSelectCity, onSelectAlliance }: Props) {
  const selectedRegion = regions.find((region) => region.cities.some((city) => city.id === selectedCityId))?.id

  return (
    <div className="coverage-nav" aria-label="Navegação territorial da cobertura">
      <div className="coverage-nav-heading"><span className="context-label">Território</span><span className="coverage-nav-caption">Regiões e cidades</span></div>
      {!regions.length ? <p className="coverage-nav-empty">Nenhuma região disponível.</p> : (
        <Accordion type="multiple" defaultValue={selectedRegion ? [selectedRegion] : []} className="coverage-nav-accordion">
          {regions.map((region) => (
            <AccordionItem key={region.id} value={region.id}>
              <AccordionTrigger className="coverage-region-trigger"><span>{region.name}</span><Badge variant="outline">{region.cities.length}</Badge></AccordionTrigger>
              <AccordionContent>
                <div className="coverage-city-links">
                  {region.cities.map((city) => (
                    <button key={city.id} type="button" className={`coverage-city-link ${city.id === selectedCityId ? 'active' : ''}`} onClick={() => onSelectCity(city.id)}>
                      <MapPin size={15} weight="duotone" aria-hidden /><span>{city.name}</span><small>{city.peopleCount}</small>
                    </button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      <div className="coverage-nav-heading coverage-nav-heading-secondary"><span className="context-label">Dobradores</span><span className="coverage-nav-caption">Visão por apoio</span></div>
      {!allianceItems.length ? <p className="coverage-nav-empty">Nenhum dobrador cadastrado.</p> : (
        <Accordion type="single" collapsible defaultValue={selectedAllianceId ? 'alliances' : undefined}>
          <AccordionItem value="alliances">
            <AccordionTrigger className="coverage-region-trigger"><span>Deputados apoiados</span><UsersThree size={16} weight="duotone" aria-hidden /></AccordionTrigger>
            <AccordionContent>
              <div className="coverage-city-links">
                {allianceItems.map((alliance) => (
                  <button key={alliance.id} type="button" className={`coverage-city-link ${alliance.id === selectedAllianceId ? 'active' : ''}`} onClick={() => onSelectAlliance(alliance.id)}>
                    <UsersThree size={15} weight="duotone" aria-hidden /><span>{alliance.name}</span>
                  </button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  )
}
