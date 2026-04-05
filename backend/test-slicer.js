import { runSliceEstimate } from "./src/services/slicer.service.js";

async function main() {
  try {
    const result = await runSliceEstimate({
      modelPath: "C:\\Users\\Kent Christian\\Documents\\Bottom_WithHole.stl",
      material: "PETG",
      quality: "draft",
      infill: 10,
      quantity: 1,
    });

    console.log("Slice estimate result:");
    console.log(result);
  } catch (error) {
    console.error("Slice estimate failed:");
    console.error(error);
  }
}

main();
