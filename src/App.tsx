import { useEffect, useState } from 'react';
import './App.css';
// luxon makes it easy for us to format dates into "in X minutes" format
import {DateTime} from 'luxon';
// we import the typescript types from another file - types help make sure our data looks right at every step
import { Istation, Ideparture } from './types';

export default function App() {
  // the station the user has selected ( and automatically set to the nearest found station)
  const [selectedStation, setSelectedStation] = useState<Istation>();
  // the list of other stations nearby
  const [stations, setStations] = useState<Istation[]>([]);
  // the list of departures from the selected station
  const [departures, setDepartures] = useState<Ideparture[]>([]);

  useEffect(()=> {
    // async wrapper (as async/await isnt allowed directly in useEffect as the callback)
    (async()=> {
      // get user's location, then find the nearest station
      try {
        const position = await getPosition();
        const { latitude, longitude } = position.coords;
        // we're sending the client location to the server, so we can get the nearest station
        await fetch(`https://v5.vbb.transport.rest/stops/nearby?latitude=${latitude}&longitude=${longitude}`)
        .then((response) => response.json())
        .then((stations) => {
          // set the nearest station by default as the selected station
          const station = stations[0] || {}
          setSelectedStation(station)
          // we save the other nearby stations as options for the user to choose from
          setStations(stations.map((station: Istation) => ({  ...station, name: `${station.name} ( ${station.distance} meters - ${((station.distance/80)).toFixed(1)} mins to walk )`})))
        })
        .catch((error) => {
          console.log(JSON.stringify(error));
        });
      } catch (err) {
        console.error(err.message);
      }
    })() 
  }, []);

  useEffect(()=> {
    const _fetch = async () => {
      if (!selectedStation) return;
      // we request the departures for the selected station
      try {
        await fetch(`https://v5.vbb.transport.rest/stops/${selectedStation.id}/departures`)
        .then((response) => response.json())
        .then((departures) => { 
          setDepartures(cleanUpDepartures(departures))
        })
        .catch((error) => {
          console.log(JSON.stringify(error));
        });
      } catch (err) {
        console.error(err.message);
      }
    }
    // we check for changes in the departure schedule every 15 seconds
    const poll = setInterval(_fetch, 15000);

    // we also fetch data when selectedStation changes
    _fetch()

    // we clean up the interval when the App component is unmounted
    return () => clearInterval(poll);
  }, [selectedStation]);

  // this is fired when somebody selects a new station from the dropdown
  const handleChange = async (selectedOption :any) => {
    if(stations.length > 0) {
      if(stations.findIndex((station) => station.id === selectedOption.target.value)) {
        setSelectedStation(stations.find((station) => station.id === selectedOption.target.value))
      }
    }
  };

  return (
    <>
      {stations.length>0 ? (
        <select onChange={handleChange}> 
          {stations.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      ) : null}
      <div className="credits">trainspotting.berlin<br/>by <a target="_blank" href="https://system-art.io" rel="noreferrer">basiclaser</a></div>
      {departures && departures.length > 0 ?
        <div className="trains">
          <table>
            <tbody> 
            {/* we loop over all departures and display them as a list */}
            {departures.map((d:Ideparture) => (
                <tr key={d.id}> 
                  <td>{d.line.name}</td> 
                  <td>{d.direction}</td> 
                  {/* we use luxon's toRelative method to format the departure time relative to now */}
                  <td className="time">{DateTime.fromISO(d.when).toRelative()}</td> 
                </tr> 
              ))}
            </tbody> 
          </table> 
        </div>
      : null}
    </>
  );
}

// this function is a promise wrapper around getCurrentPosition to make it easier to use
function getPosition(): Promise<any> {
  return new Promise((resolve, reject) => 
      navigator.geolocation.getCurrentPosition(resolve, reject, {maximumAge:10000, timeout:15000, enableHighAccuracy: true})
  );
}

// this function cleans up the departures data to make it easier to work with and display
function cleanUpDepartures(departures: any) {
  return departures.map((d:any) => ({
    tripId: d.tripId,
    id: Math.random()*1000000,
    stop: {
      products: {
        suburban: d.stop.products.suburban,
        subway: d.stop.products.subway,
        tram: d.stop.products.tram,
        bus: d.stop.products.bus,
        ferry: d.stop.products.ferry,
        express: d.stop.products.express,
        regional: d.stop.products.regional
      }
    },
    when: d.when,
    plannedWhen: d.plannedWhen,
    delay: d.delay,
    platform: d.platform,
    direction: d.direction,
    line: {
      name: d.line.name
    }
  } as Ideparture))
}
