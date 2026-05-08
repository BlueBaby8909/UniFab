import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage, Center } from "@react-three/drei";
import { STLLoader, OBJLoader, ThreeMFLoader } from "three-stdlib";
import { useLoader } from "@react-three/fiber";

function StlModel({ url }) {
  const geometry = useLoader(STLLoader, url);
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#475569" roughness={0.5} />
    </mesh>
  );
}

function ObjModel({ url }) {
  const obj = useLoader(OBJLoader, url);
  return <primitive object={obj} />;
}

function ThreeMfModel({ url }) {
  const group = useLoader(ThreeMFLoader, url);
  return <primitive object={group} />;
}

function DynamicModel({ url, extension }) {
  if (extension === ".stl") return <StlModel url={url} />;
  if (extension === ".obj") return <ObjModel url={url} />;
  if (extension === ".3mf") return <ThreeMfModel url={url} />;
  return null;
}

export function ModelViewer({ file }) {
  // Create a temporary local URL for the uploaded file so Three.js can load it
  const fileUrl = useMemo(() => {
    if (file) {
      return URL.createObjectURL(file);
    }
    return null;
  }, [file]);

  if (!file) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500">
        Upload a file to preview
      </div>
    );
  }

  const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
  const supportedExtensions = [".stl", ".obj", ".3mf"];

  if (!supportedExtensions.includes(extension)) {
    return (
       <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500 p-4 text-center">
        3D preview is currently only available for .stl, .obj, and .3mf files. <br/> Your file might still be valid for quoting!
      </div>
    )
  }

  return (
    <div className="h-64 w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100 cursor-move">
      <Canvas shadows camera={{ position: [0, 0, 150], fov: 50 }}>
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.6}>
            <Center>
              <DynamicModel url={fileUrl} extension={extension} />
            </Center>
          </Stage>
        </Suspense>
        <OrbitControls autoRotate autoRotateSpeed={2} makeDefault />
      </Canvas>
    </div>
  );
}
