import { environment, getPreferenceValues } from "@raycast/api";
import { runJxa } from "run-jxa";

import { basename, extname } from "path";
import { lstatSync, readdirSync, existsSync, mkdirSync } from "fs";

import { Pocket, Card, Preferences } from "./types";

export const walletPath = getWalletPath();

function getWalletPath() {
  const preferences = getPreferenceValues<Preferences>();
  if (preferences.walletDirectory) {
    const definedDir = lstatSync(preferences.walletDirectory);
    if (definedDir.isDirectory()) return preferences.walletDirectory;
  }
  return environment.supportPath;
}

export async function fetchFiles(dir: string): Promise<Pocket[]> {
  const pocketArr: Pocket[] = [];

  loadPocketCards(dir).then((cards) => {
    if (cards.length > 0) pocketArr.push({ cards: cards });
  });

  const items = readdirSync(walletPath);
  items.forEach((item) => {
    const filePath = `${dir}/${item}`;
    const fileStats = lstatSync(filePath);
    const fileExt = extname(filePath);
    const fileName = basename(filePath, fileExt);

    if (!fileStats.isDirectory()) return;
    if (fileName.startsWith(".")) return;

    loadPocketCards(`${dir}/${item}`).then((cards) => {
      // const vids = cards.filter(item => {
      //   return item.preview
      // })

      // console.log(vids)

      if (item == "Videos") { console.log(cards) }

      pocketArr.push({ name: item, cards: cards });
    });
  });

  return pocketArr;
}

async function loadPocketCards(dir: string): Promise<Card[]> {
  const cardArr: Card[] = [];

  const items = readdirSync(dir);
  items.forEach(async (item) => {
    const filePath = `${dir}/${item}`;
    const fileStats = lstatSync(filePath);
    const fileExt = extname(filePath);
    const fileName = basename(filePath, fileExt);

    if (fileStats.isDirectory()) return;
    if (fileName.startsWith(".")) return;

    const videoExts = [".mov", ".mp4"];

    if (videoExts.includes(fileExt)) {
      const previewDir = `${environment.supportPath}/.previews`;

      if (!existsSync(previewDir)) {
        mkdirSync(previewDir);
      }

      const previewPath = await generateVideoPreview(
        filePath,
        `${previewDir}/${dir.replaceAll("/", "-")}:${item}.tiff`
      );

      // console.log(cardArr)

      return cardArr.push({ name: fileName, path: filePath, preview: previewPath });
    }

    return cardArr.push({ name: fileName, path: filePath });
  });

  return cardArr;
}

async function generateVideoPreview(inputPath: string, outputPath: string): Promise<string | undefined> {
  const previewPath = (
    await runJxa(
      `
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
    return undefined;
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

  return outputPath
  }`,
      [inputPath, outputPath]
    )
  )?.toString();

  return previewPath;
}
