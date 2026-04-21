import Container from "../images/Container.jpg";
import HeroBanner from "../../pages/HeroBanner";
export default function GridShape() {
  return (
    <>
      <div
        className="
          absolute
          right-0
          top-0
          -z-1
          w-[105%]
          h-[105%]
          
          transform
          -translate-y-32
          -translate-x-10
        "
        style={{"marginTop":"-250px"}}
      >
        {/* <img
          src={HeroBanner}
          alt="grid"
          className="w-full h-auto object-contain"
        /> */}
        <HeroBanner/>
      </div>
    </>
  );
}
