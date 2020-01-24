
//% color=190 weight=100 icon="\uf041"
namespace SN01 {

    export enum format {
        //% block=raw
        RAW = 0,
        //% block=DMS
        DMS = 1,
        //%block=DD
        DD = 2
    }

    export enum speed_format {
        //% block=knots
        KNOTS = 0,
        //% block=KPH
        KPH = 1,
        //% block=MPH
        MPH = 2
    }

    let sentence_type = ""
    let j = 0
    let nmea_sentence = ""
    let raw_EW = ""
    let raw_NS = ""
    let raw_time: number
    let raw_lat: number
    let raw_lon: number
    let raw_fix: number
    let raw_sat: number
    let raw_hdop: number
    let raw_alt: number
    let raw_SOG: number
    let raw_CMG: number
    let raw_date: number
    let raw_mag_var: number
    let raw_GPS_quality: number
    let raw_height: number
    let raw_geoid_sep: number
    let valid: string = ""
    let GPRMC: string[]
    let GPGGA: string[]

    function poll(): number {
        let numBytes: number
        pins.i2cWriteNumber(0x42, 0xFD, NumberFormat.UInt8BE)
        numBytes = pins.i2cReadNumber(0x42, NumberFormat.UInt8BE)
        numBytes <<= 8
        numBytes |= pins.i2cReadNumber(0x42, NumberFormat.UInt8BE)

        return numBytes
    }

    function readBytes(): string {
        let byte: number
        let char: string
        byte = pins.i2cReadNumber(0x42, NumberFormat.UInt8BE)
        char = String.fromCharCode(byte)

        return char

    }

    function parseNMEA() {
        let temp_string: string = ""
        let nmea_sentence: string = readBytes()
        if (nmea_sentence.compare("$") == 0) {
            j = 0
            sentence_type = ""
            while (j < 5) {
                sentence_type += readBytes()
                j += 1
            }
        }
        if (sentence_type.compare("GPRMC") == 0) {
            sentence_type = ""
            readBytes()
            let temp_char: string = ""
            while (true) {
                temp_char = readBytes()
                if ((temp_char.compare("\n") == 0) || (temp_char.compare("\r") == 0)) {
                    basic.pause(100)
                    GPRMC = helpers.stringSplit(temp_string, ",")
                    raw_time = parseFloat(GPRMC[0])
                    valid = GPRMC[1]
                    raw_lat = parseFloat(GPRMC[2])
                    raw_NS = GPRMC[3]
                    raw_lon = parseFloat(GPRMC[4])
                    raw_EW = GPRMC[5]
                    raw_SOG = parseFloat(GPRMC[6])
                    raw_CMG = parseFloat(GPRMC[7])
                    raw_date = parseFloat(GPRMC[8])
                    raw_mag_var = parseFloat(GPRMC[9])
                    temp_string = ""
                    break
                } else {
                    temp_string += temp_char
                }
            }
        } else if (sentence_type.compare("GPGGA") == 0) {
            sentence_type = ""
            readBytes()
            let temp_char: string = ""
            while (true) {
                temp_char = readBytes()
                if ((temp_char.compare("\n") == 0) || (temp_char.compare("\r") == 0)) {
                    basic.pause(100)
                    GPGGA = helpers.stringSplit(temp_string, ",")
                    raw_time = parseFloat(GPGGA[0])
                    raw_lat = parseFloat(GPGGA[1])
                    raw_NS = GPGGA[2]
                    raw_lon = parseFloat(GPGGA[3])
                    raw_EW = GPGGA[4]
                    raw_GPS_quality = parseFloat(GPGGA[5])
                    raw_sat = parseFloat(GPGGA[6])
                    raw_hdop = parseFloat(GPGGA[7])
                    raw_height = parseFloat(GPGGA[8])
                    raw_geoid_sep = parseFloat(GPGGA[10])
                    temp_string = ""
                    break
                } else {
                    temp_string += temp_char
                }
            }
        }

    }

    //%block="SN01 is data valid"
    export function dataValid(): boolean {
        parseNMEA()
        if (valid.compare("A") == 0) {
            return true
        } else {
            return false
        }
    }

    //% block="SN01 get latitude %lat_format"
    export function getLat(lat_format: format): string {
        parseNMEA()
        let latitude: number = raw_lat
        let orient: string = raw_NS
        let degrees: number = Math.trunc(latitude / 100)
        let minutes: number = Math.trunc(latitude % 100)
        let seconds: number = ((((latitude) % 100) * 10000) % 10000) * 60 / 10000
        let DD: number = degrees + minutes / 60 + seconds / 3600
        let final_lat: string = ""



        if (lat_format == format.RAW) {
            final_lat = latitude.toString() + orient
        }
        else if (lat_format == format.DMS) {
            final_lat = degrees.toString() + "d" + minutes.toString() + "\'" + seconds.toString() + "\"" + orient
        }
        else if (lat_format == format.DD) {
            final_lat = DD.toString() + orient
        }

        return final_lat
    }

    //% block="SN01 get longitude %lon_format"
    export function getLon(lon_format: format): string {
        parseNMEA()
        let longitude: number = raw_lon
        let orient: string = raw_EW
        let degrees: number = Math.trunc(longitude / 100)
        let minutes: number = Math.trunc(longitude % 100)
        let seconds: number = ((((longitude) % 100) * 10000) % 10000) * 60 / 10000
        let DD: number = degrees + minutes / 60 + seconds / 3600
        let final_lat: string = ""



        if (lon_format == format.RAW) {
            final_lat = longitude.toString() + orient
        }
        else if (lon_format == format.DMS) {
            final_lat = degrees.toString() + "d" + minutes.toString() + "\'" + seconds.toString() + "\"" + orient
        }
        else if (lon_format == format.DD) {
            final_lat = DD.toString() + orient
        }

        return final_lat
    }

    //% block="SN01 get satellites number"
    export function getSat(): string {
        parseNMEA()
        return raw_sat.toString()
    }

    //% block="SN01 get hdop"
    export function getHDOP(): string {
        parseNMEA()
        return raw_hdop.toString()
    }

    //% block="SN01 get altitude(m)""
    export function getALT(): string {
        parseNMEA()
        return raw_height.toString()
    }

    //% block="SN01 get speed %speed_sog"
    export function getSpeed(speed_sog: speed_format): string {
        parseNMEA()
        let speed: string = ""
        let knots: number = raw_SOG
        let mph: number = knots * 1.151
        let kph: number = knots * 1.852

        if (speed_sog == speed_format.KNOTS) {
            speed = knots.toString()
        } else if (speed_sog == speed_format.KPH) {
            speed = kph.toString()
        }
        else if (speed_sog == speed_format.MPH) {
            speed = mph.toString()
        }

        return speed
    }


    //% block="SN01 get time"
    export function getTime(): string {
        parseNMEA()
        let time_str: string = ""
        let time: number = raw_time
        let hh: number = Math.trunc(time / 10000)
        let mm: number = Math.trunc((time % 10000) / 100)
        let ss: number = Math.trunc(time % 100)

        time_str = hh.toString() + ":" + mm.toString() + ":" + ss.toString()

        return time_str
    }

    //% block="SN01 get date"
    export function getDate(): string {
        parseNMEA()
        let date_str: string = ""
        let date: number = raw_date
        let dd: number = Math.trunc(date / 10000)
        let mm: number = Math.trunc((date % 10000) / 100)
        let yy: number = Math.trunc(date % 100)

        date_str = dd.toString() + "/" + mm.toString() + "/" + yy.toString()

        return date_str
    }



}