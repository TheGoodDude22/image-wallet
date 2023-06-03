(() => {
  ObjC.import("objc");
  ObjC.import("CoreMedia");
  ObjC.import("Foundation");
  ObjC.import("AVFoundation");
  ObjC.import("CoreGraphics");
  ObjC.import("CoreImage");
  ObjC.import("AppKit");
  
  const [inputPath, outputPath] = args;

  // Load the video file
  const assetURL = $.NSURL.fileURLWithPath(
    inputPath
  );
  const asset = $.objc_getClass("AVAsset").assetWithURL(assetURL);

  // Ensure the video has a video track
  if (asset.tracksWithMediaType($.AVMediaTypeVideo).count == 0) {
    return "";
  }

  const frameCount = 15; // The number of frames to analyze

  // Set up the AVAssetReader for reading the video frames into pixel buffers
  const reader = $.objc_getClass("AVAssetReader").alloc.initWithAssetError(
    asset,
    null
  );
  const track = asset.tracksWithMediaType($.AVMediaTypeVideo).objectAtIndex(0);
  const settings = $.NSDictionary.dictionaryWithObjectForKey(
    "420v",
    "PixelFormatType"
  );
  readerOutput = $.objc_getClass(
    "AVAssetReaderTrackOutput"
  ).alloc.initWithTrackOutputSettings(track, settings);
  reader.addOutput(readerOutput);
  reader.startReading;

  // Read the video frames into pixel buffers
  let buf = readerOutput.copyNextSampleBuffer;
  if (reader.status != $.AVAssetReaderStatusFailed) {
    const imageBufferRef = ObjC.castRefToObject(
      $.CMSampleBufferGetImageBuffer(buf)
    );
  const CIImage = $.CIImage.imageWithCVPixelBuffer(imageBufferRef)
  const imageRep = $.NSBitmapImageRep.alloc.initWithCIImage(CIImage)
  const imageData = imageRep.TIFFRepresentation
  imageData.writeToFileAtomically(outputPath, true)
  }

  // return outputPath
})()