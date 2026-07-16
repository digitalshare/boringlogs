import { nanoid } from 'nanoid'
import type { Project, Boring, SieveChart } from '../types'

// Seed project recreating the reference figures:
// Boring 1 of "Fig 3-5 Boring Logs.pdf" and the sieve chart of Fig 10.

function boring1(): Boring {
  return {
    id: nanoid(),
    number: '1',
    surfaceElevation: 'Not Available',
    water: { encountered: true, depthFt: 7.2, date: '3-9-26', time: '10:34am' },
    dateCompleted: '3-9-26',
    bohDepthFt: 15,
    strata: [
      {
        id: nanoid(),
        topDepthFt: 0,
        description: '3.5" AC Pavement over 3.5" Tan Poorly-graded Beach Sand',
        uscs: 'PAVEMENT',
      },
      {
        id: nanoid(),
        topDepthFt: 0.6,
        description: 'Brown Clayey SILT (ML), very stiff, damp',
        uscs: 'ML',
        unitLabel: 'FILL',
      },
      {
        id: nanoid(),
        topDepthFt: 5,
        description: 'Tan to Gray Well-graded SAND (SW-SM) with Silt, medium dense, damp',
        uscs: 'SW-SM',
        unitLabel: 'BEACH SAND',
      },
      {
        id: nanoid(),
        topDepthFt: 8,
        description: 'Gray Silty Coral SAND (SM), medium dense, saturated',
        uscs: 'SM',
        unitLabel: 'LAGOONAL',
      },
    ],
    samples: [
      {
        id: nanoid(),
        number: '1',
        depthFt: 1.5,
        rawBlows: '11',
        nValue: '8',
        seeLegend: true,
        moisturePct: 43,
        dryDensityPcf: 85,
        labResults: 'pH= 7.5\nMinimum Electrical Resistivity= 900ohm-cm',
      },
      {
        id: nanoid(),
        number: '2',
        depthFt: 3.5,
        rawBlows: '42',
        nValue: '29',
        seeLegend: false,
        moisturePct: 21,
        dryDensityPcf: 105,
        labResults: 'LL= 49, PI= 18',
      },
      {
        id: nanoid(),
        number: '3',
        depthFt: 6,
        rawBlows: '30',
        nValue: '16',
        seeLegend: false,
        moisturePct: 24,
        dryDensityPcf: 100,
        labResults: '',
      },
      {
        id: nanoid(),
        number: '4',
        depthFt: 8.5,
        rawBlows: '21',
        nValue: '11',
        seeLegend: false,
        moisturePct: 16,
        labResults: 'Gradation:\nGravel= 10%\nSand= 76%\nSilt/Clay= 14%',
      },
      {
        id: nanoid(),
        number: '5',
        depthFt: 13.5,
        rawBlows: '7',
        nValue: '4',
        seeLegend: false,
        moisturePct: 43,
        dryDensityPcf: 80,
        labResults: '',
      },
    ],
    subNotes: [{ id: nanoid(), depthFt: 13, text: "At 13.0', grades very loose" }],
  }
}

function sieveChart(): SieveChart {
  return {
    id: nanoid(),
    name: 'Grain Size — Sample 1-4',
    samples: [
      {
        id: nanoid(),
        label: '1 - 4',
        depthFt: 8.5,
        classification: 'Gray Silty Coral SAND (SM)',
        mcPct: 16,
        markerShape: 'circle',
        points: [
          { sizeMm: 25, percentFiner: 100 },
          { sizeMm: 19, percentFiner: 97 },
          { sizeMm: 9.5, percentFiner: 95 },
          { sizeMm: 4.75, percentFiner: 90 },
          { sizeMm: 2.0, percentFiner: 84 },
          { sizeMm: 0.85, percentFiner: 66 },
          { sizeMm: 0.425, percentFiner: 42 },
          { sizeMm: 0.15, percentFiner: 24 },
          { sizeMm: 0.075, percentFiner: 14 },
        ],
      },
    ],
  }
}

export function makeSeedProject(): Project {
  return {
    id: nanoid(),
    name: 'Quick Quack Car Wash Facility',
    projectLine1: 'Quick Quack Car Wash Facility',
    projectLine2: '4-771 Kuhio Highway- Waipouli Town Center',
    location: 'Kapaa, Kauai, Hawaii',
    fileNumber: '3609.01',
    projectEngineer: 'JN',
    fieldEngineer: 'JN',
    draftedBy: 'KSL',
    dateOfDrawing: 'May 2026',
    companyLabel: 'F.G.E. Ltd.',
    boringFigureStart: 3,
    sieveFigureStart: 10,
    borings: [boring1()],
    sieveCharts: [sieveChart()],
  }
}

export function makeEmptyBoring(number: string): Boring {
  return {
    id: nanoid(),
    number,
    surfaceElevation: 'Not Available',
    water: { encountered: false, date: '', time: '' },
    dateCompleted: '',
    bohDepthFt: 15,
    strata: [],
    samples: [],
    subNotes: [],
  }
}

export function makeEmptyProject(name: string): Project {
  return {
    id: nanoid(),
    name,
    projectLine1: name,
    projectLine2: '',
    location: '',
    fileNumber: '',
    projectEngineer: '',
    fieldEngineer: '',
    draftedBy: '',
    dateOfDrawing: '',
    companyLabel: 'F.G.E. Ltd.',
    boringFigureStart: 3,
    sieveFigureStart: 10,
    borings: [makeEmptyBoring('1')],
    sieveCharts: [],
  }
}

export function makeEmptySieveChart(name: string): SieveChart {
  return { id: nanoid(), name, samples: [] }
}
