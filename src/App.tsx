import { useEffect, useState } from 'react';
import './App.css';
// luxon makes it easy for us to format dates into "in X minutes" format
import {DateTime, ToRelativeOptions} from 'luxon';
// we import the typescript types from another file - types help make sure our data looks right at every step
import { Istation, Ideparture } from './types';
import Marquee from "react-fast-marquee";
import useInterval from './useInterval.js';

export default function App() {
  // the station the user has selected ( and automatically set to the nearest found station)
  const [selectedStation, setSelectedStation] = useState<Istation>();
  // the list of other stations nearby
  const [stations, setStations] = useState<Istation[]>([]);
  // the list of departures from the selected station
  const [departures, setDepartures] = useState<Ideparture[]>([]);
  const [cycleRow, setCycleRow] = useState<number>(0);

  useEffect(()=> {
    // async wrapper (as async/await isnt allowed directly in useEffect as the callback)
    (async()=> {
      // get user's location, then find the nearest station
      try {
        const position = await getPosition();
        const { latitude, longitude } = position.coords;
        // we're sending the client location to the server, so we can get the nearest station
        await fetch(`https://v5.vbb.transport.rest/stops/nearby?latitude=${52.4365961}&longitude=${13.5884297}`)
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
          console.log(departures)
          setDepartures(departures)
        })
        .catch((error) => {
          console.log(JSON.stringify(error));
        });
      } catch (err) {
        console.error(err.message);
      }
    }
    // we check for changes in the departure schedule every 15 seconds
    const poll = setInterval(_fetch, 25000);

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

  // this custom interval function is used to change which row of text is scrolling.
  // the rate at which the interval changes is determined by the total length of text in the warning-type remarks in each departure
  // a dynamic interval time is not possible with a normal setInterval function
  useInterval(() => {
    console.log(cycleRow, departures.length,  departures[cycleRow] ? departures[cycleRow].remarks.length * 15000 : null)
    setCycleRow((p)=> {
      let res = (p + 1) % departures.length
      // if the next departure doesn't have any warning-type remarks, we move to the next departure
      if(departures[res].remarks.filter((r) => r.type === 'warning').length > 0) {
        return res
      } else {
        return (p + 2) % departures.length
      }
    });
  }, departures[cycleRow] ? (departures[cycleRow].remarks
    .filter((r) => r.type === 'warning')
    .map(r => r.summary).join("")
    .length * 485) + 10000: null);

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
            {departures
            .filter ( departure => new Date(departure.when).getTime() > Date.now())
            .map((d:Ideparture, i) => {
              // we format the departure time into a nicer format
              let time = DateTime.fromISO(d.when.toString()).toRelative()
              if(time) {
                time = time.replace("in ", "").replace("utes","").replace("ute","")
                if(time.includes("seconds")) time = "<1 min"
              }
                return (
                  <tr key={d.tripId}> 
                    <td style={{"width": "10%"}}>{d.line.name}</td>
                    <td style={{width: "70%"}}>
                      { cycleRow === i ? (
                        <Marquee delay={10} gradient={false} speed={100}>
                          <span>{d.direction} </span>{" "}
                          {d.remarks
                          .filter((r) => r.type === 'warning')
                          .map((r, i, arr) => (
                            <span key={r.id} className={`remark${i===arr.length-1? " remark-last":""}`}> {" "}{r.summary}</span>
                          ))}
                        </Marquee>
                      ) : (
                        <span>{d.direction}</span>
                      )}
                    </td> 
                    <td style={{"width": "20%"}} className="time">{time}</td> 
                  </tr>
              ) 
                })} 
            </tbody> 
          </table> 
        </div>
      : "loading (or you're not in Berlin)"}
    </>
  );
}

// this function is a promise wrapper around getCurrentPosition to make it easier to use
function getPosition(): Promise<any> {
  return new Promise((resolve, reject) => 
      navigator.geolocation.getCurrentPosition(resolve, reject, {maximumAge:10000, timeout:15000, enableHighAccuracy: true})
  );
}
