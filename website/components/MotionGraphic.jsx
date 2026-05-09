import ServiceCycleStatus from "@/components/ServiceCycleStatus";

export default function MotionGraphic({ title = "Canlı Servis Akışı" }) {
  return (
    <div className="motion-graphic" aria-label={title}>
      <div className="motion-grid" />
      <div className="motion-head">
        <span>{title}</span>
        <ServiceCycleStatus />
      </div>
      <div className="shaft-scene">
        <div className="shaft">
          <span className="floor-line f1" />
          <span className="floor-line f2" />
          <span className="floor-line f3" />
          <span className="floor-line f4" />
          <div className="elevator-car">
            <span />
            <span />
          </div>
          <div className="counterweight" />
        </div>
        <div className="telemetry">
          <div className="ring ring-a"><span>35dk</span></div>
          <div className="ring ring-b"><span>7/24</span></div>
          <div className="signal-bars">
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>
      </div>
      <div className="motion-footer">
        <span>Bakım</span>
        <span>Revizyon</span>
        <span>Arıza</span>
      </div>
    </div>
  );
}
