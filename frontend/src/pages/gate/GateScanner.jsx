import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { ScanLine, Camera, CameraOff, CheckCircle2, XCircle, Keyboard } from 'lucide-react';
import client, { apiErrorMessage } from '../../api/client';

const SCANNER_ELEMENT_ID = 'gate-qr-reader';

export default function GateScanner() {
  const [manualCode, setManualCode] = useState('');
  const [result, setResult] = useState(null); // { valid, message, ticket }
  const [busy, setBusy] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [log, setLog] = useState([]);
  const scannerRef = useRef(null);
  const lastScanRef = useRef({ code: null, at: 0 });

  async function validate(qrCode) {
    if (!qrCode || busy) return;
    setBusy(true);
    try {
      const { data } = await client.post('/tickets/validate', { qrCode });
      setResult({ valid: true, message: data.message, ticket: data.ticket });
      pushLog(true, data.ticket?.fan_name, data.ticket?.seat_number);
    } catch (err) {
      const data = err?.response?.data;
      setResult({ valid: false, message: data?.message || apiErrorMessage(err), ticket: data?.ticket });
      pushLog(false, data?.ticket?.fan_name, data?.ticket?.seat_number);
    } finally {
      setBusy(false);
    }
  }

  function pushLog(valid, fanName, seat) {
    setLog((prev) => [{ id: Date.now(), valid, fanName, seat, at: new Date() }, ...prev].slice(0, 8));
  }

  async function startCamera() {
    setCameraError('');
    try {
      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          const now = Date.now();
          // Debounce: ignore the same code re-firing within 3s while the QR
          // stays in frame.
          if (lastScanRef.current.code === decodedText && now - lastScanRef.current.at < 3000) return;
          lastScanRef.current = { code: decodedText, at: now };
          validate(decodedText);
        },
        () => {} // ignore per-frame decode failures
      );
      setCameraOn(true);
    } catch (err) {
      setCameraError('Could not access the camera. You can still enter ticket codes manually below.');
    }
  }

  async function stopCamera() {
    try {
      await scannerRef.current?.stop();
      await scannerRef.current?.clear();
    } catch { /* already stopped */ }
    setCameraOn(false);
  }

  useEffect(() => () => { scannerRef.current?.stop().catch(() => {}); }, []);

  function handleManualSubmit(e) {
    e.preventDefault();
    validate(manualCode.trim());
    setManualCode('');
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <p className="label-eyebrow">Gate Entry</p>
      <h1 className="mt-1 flex items-center gap-2 font-display text-4xl tracking-wide text-chalk">
        <ScanLine className="text-flood" /> Validate Ticket
      </h1>
      <p className="mt-2 text-chalk-dim">Scan a fan's QR code, or type the ticket code if the camera isn't available.</p>

      <div className="card mt-6 p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <p className="label-eyebrow">Camera scanner</p>
          <button onClick={cameraOn ? stopCamera : startCamera} className={cameraOn ? 'btn-danger !px-3 !py-1.5' : 'btn-secondary !px-3 !py-1.5'}>
            {cameraOn ? <><CameraOff size={14} /> Stop</> : <><Camera size={14} /> Start Camera</>}
          </button>
        </div>
        {cameraError && <p className="mt-2 text-sm text-alert">{cameraError}</p>}
        <div id={SCANNER_ELEMENT_ID} className={`mt-3 overflow-hidden rounded-lg ${cameraOn ? 'block' : 'hidden'}`} />
        {!cameraOn && (
          <div className="mt-3 flex h-40 items-center justify-center rounded-lg border border-dashed border-pitch-line text-sm text-chalk-dim">
            Camera preview will appear here
          </div>
        )}

        <form onSubmit={handleManualSubmit} className="mt-5 flex items-center gap-2 border-t border-pitch-line pt-5">
          <Keyboard size={16} className="shrink-0 text-chalk-dim" />
          <input
            className="input-field font-mono"
            placeholder="Or type / paste ticket code…"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
          />
          <button type="submit" disabled={busy || !manualCode.trim()} className="btn-primary shrink-0">Check</button>
        </form>
      </div>

      {result && (
        <div className={`card mt-6 p-6 text-center ${result.valid ? 'border-pitch-bright/50' : 'border-alert/50'}`}>
          {result.valid ? <CheckCircle2 size={40} className="mx-auto text-pitch-bright" /> : <XCircle size={40} className="mx-auto text-alert" />}
          <p className={`mt-3 font-display text-2xl tracking-wide ${result.valid ? 'text-pitch-bright' : 'text-alert'}`}>
            {result.valid ? 'ENTRY GRANTED' : 'ENTRY DENIED'}
          </p>
          <p className="mt-1 text-chalk-dim">{result.message}</p>
          {result.ticket && (
            <div className="mt-4 flex justify-center gap-6 border-t border-pitch-line pt-4 text-sm">
              <div><p className="label-eyebrow">Fan</p><p className="text-chalk">{result.ticket.fan_name || '—'}</p></div>
              <div><p className="label-eyebrow">Seat</p><p className="text-chalk">{result.ticket.section} {result.ticket.seat_number}</p></div>
              <div><p className="label-eyebrow">Match</p><p className="text-chalk">{result.ticket.event_name}</p></div>
            </div>
          )}
        </div>
      )}

      {log.length > 0 && (
        <div className="mt-6">
          <p className="label-eyebrow mb-2">Recent scans</p>
          <ul className="space-y-1.5">
            {log.map((entry) => (
              <li key={entry.id} className="card flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="flex items-center gap-2">
                  {entry.valid ? <CheckCircle2 size={14} className="text-pitch-bright" /> : <XCircle size={14} className="text-alert" />}
                  {entry.fanName || 'Unknown'} {entry.seat ? `· Seat ${entry.seat}` : ''}
                </span>
                <span className="font-mono text-xs text-chalk-dim">{entry.at.toLocaleTimeString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
