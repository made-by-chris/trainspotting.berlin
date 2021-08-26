
export interface Istation {
    type: string
    id: string
    name: string
    location: {
        type: string
        id: string
        latitude: number
        longitude: number
    }
    products: {
        suburban: boolean
        subway: boolean
        tram: boolean
        bus: boolean
        ferry: boolean
        express: boolean
        regional: boolean
    }
    distance: number
}
export interface Ideparture {
    tripId: string
    id: number
    stop: {
        products: {
            suburban: boolean
            subway: boolean
            tram: boolean
            bus: boolean
            ferry: boolean
            express: boolean
            regional: boolean
        }
    }
    when: string
    plannedWhen: string
    delay: any
    platform: any
    direction: string
    line: {
        name: string
    }
}