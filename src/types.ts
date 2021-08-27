
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

export interface Location {
    type: string;
    id: string;
    latitude: number;
    longitude: number;
}

export interface Products {
    suburban: boolean;
    subway: boolean;
    tram: boolean;
    bus: boolean;
    ferry: boolean;
    express: boolean;
    regional: boolean;
}

export interface Stop {
    type: string;
    id: string;
    name: string;
    location: Location;
    products: Products;
}

export interface Operator {
    type: string;
    id: string;
    name: string;
}

export interface Line {
    type: string;
    id: string;
    fahrtNr: string;
    name: string;
    public: boolean;
    adminCode: string;
    mode: string;
    product: string;
    operator: Operator;
    symbol?: any;
    nr: number;
    metro: boolean;
    express: boolean;
    night: boolean;
}

export interface Icon {
    type: string;
    title?: any;
}

export interface Products2 {
    suburban: boolean;
    subway: boolean;
    tram: boolean;
    bus: boolean;
    ferry: boolean;
    express: boolean;
    regional: boolean;
}

export interface Remark {
    type: string;
    code: string;
    text: string;
    id: string;
    summary: string;
    icon: Icon;
    priority?: number;
    products: Products2;
    company: string;
    category?: number;
    validFrom?: Date;
    validUntil?: Date;
    modified?: Date;
}

export interface Ideparture {
    tripId: string;
    stop: Stop;
    when: Date;
    plannedWhen: Date;
    delay: number;
    platform?: any;
    plannedPlatform?: any;
    direction: string;
    provenance?: any;
    line: Line;
    remarks: Remark[];
}