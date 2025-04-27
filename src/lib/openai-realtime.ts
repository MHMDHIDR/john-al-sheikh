// Configuration for IELTS speaking test

export const TEST_DURATION = 600; // 10 minutes

export const VOICE = "ash";

// Event type for test state
export const TEST_EVENTS = {
  TEST_ENDED: "test_ended",
  SECTION_CHANGED: "section_changed",
};

export const SYSTEM_MESSAGE = `Introduce yourself as "John Al-Sheikh", the IELTS examiner, Before starting the test, please remind the candidate that the test will last for 10 minutes, as this is a mock test that looks like the real IELTS test, and that they should speak clearly and use professional language.

First and foremost, ask the candidate to introduce himself/herself, you MUST wait for the candidate to respond first.

After the candidate has introduced himself/herself, begin with section 1 of the test.
Section 1: Introduction and General Questions (2-3 minutes)
- DO NOT proceed to Section 1 until the candidate has introduced himself/herself.
- Ask the candidate about familiar topics like their home, family, work, studies, or interests.
- Ask ONE follow-up question based on their response.

Section 2: Individual Long Turn (2-3 minutes)
- Give the candidate a topic title.
- Allow them ONE minute to prepare.
- DO NOT give the candidate any other instructions or commands on when to start speaking.
- Let them speak for up to TWO minutes without interruption.
- The topic should be general enough for anyone to discuss (e.g., "Describe a skill you would like to learn", "Describe a time you were late for work", "A hobby you enjoy doing at free time", "Describe a time you were in a traffic jam").

Section 3: Two-way Discussion (3-4 minutes)
- Ask TWO deeper, more abstract questions related to the Section 2 topic, and allow the candidate to speak for up to 2 minutes for each question.

After receiving answers to these questions, inform the candidate that the test is now complete and thank them for their participation. End the test.

Important guidelines:
- DO NOT offer the candidate any recordings of any kind.
- Speak clearly and use professional language.
- Ask one question at a time.
- Allow the candidate to finish speaking before responding.
- Do not provide feedback on performance during the test.
- Be encouraging but neutral in your responses.
- Keep track of which section you're in and manage the timing accordingly.
- Indicate clearly when moving to a new section.

CRITICAL Notice: You must STRICTLY stay within the scope of the IELTS speaking test. If the candidate attempts to discuss any unrelated topics or asks you about anything outside the test context, respond with: "Sorry, I'm John Al-Sheikh, and I'm not allowed to speak about anything else. Let's focus on the matter at hand - this is an IELTS speaking test." Do not deviate from your role as an IELTS examiner under any circumstances.`;

// List of Event Types to log
export const LOG_EVENT_TYPES = [
  "response.content.done",
  "rate_limits.updated",
  "response.done",
  "input_audio_buffer.committed",
  "input_audio_buffer.speech_stopped",
  "input_audio_buffer.speech_started",
  "session.created",
  "response.text.done",
  "conversation.item.input_audio_transcription.completed",
  "response.audio_transcript.delta",
  "response.audio_transcript.done",
];

// Type definitions for WebRTC events
export type OpenAIRealtimeEvent = {
  type: string;
  session_id?: string;
  transcription?: {
    text: string;
  };
  data?: {
    text: string;
  };
  buffer?: string;
  [key: string]: any;
};

// Global WebRTC variables
let peerConnection: RTCPeerConnection | null = null;
let dataChannel: RTCDataChannel | null = null;
let audioQueue: Uint8Array[] = [];
let isAudioQueueProcessing = false;
let testTimer: NodeJS.Timeout | null = null;
let isTestEnded = false;
let testEndedListeners: Array<() => void> = [];

// List of IELTS-appropriate topics to check against
const IELTS_TOPICS = [
  "home",
  "family",
  "work",
  "job",
  "study",
  "education",
  "hobby",
  "travel",
  "food",
  "music",
  "book",
  "movie",
  "sport",
  "friend",
  "weather",
  "city",
  "country",
  "language",
  "culture",
  "tradition",
  "holiday",
  "technology",
  "environment",
  "health",
  "transport",
  "childhood",
  "future",
  "leisure",
  "skill",
  "experience",
  "achievement",
  "challenge",
  "learning",
  "history",
];

// Function to setup a timer for the test
export function setupTestTimer(durationInSeconds: number, callback: () => void): void {
  // Clear any existing timer
  clearTestTimer();

  // Set up a new timer
  testTimer = setTimeout(() => {
    callback();
    clearTestTimer();
  }, durationInSeconds * 1000);

  console.log(`Test timer set for ${durationInSeconds} seconds`);
}

// Function to clear the test timer
export function clearTestTimer(): void {
  if (testTimer) {
    clearTimeout(testTimer);
    testTimer = null;
    console.log("Test timer cleared");
  }
}

// Check if text contains non-IELTS content
export function detectNonIELTSContent(text: string): boolean {
  // Convert to lowercase for easier matching
  const lowerText = text.toLowerCase();

  // Check for potentially problematic topics/keywords
  const bannedTopics = [
    "politics",
    "religion",
    "sex",
    "porn",
    "gambling",
    "drugs",
    "alcohol",
    "weapons",
    "hack",
    "illegal",
    "bitcoin",
    "crypto",
    "investment",
    "stock",
    "password",
    "private",
    "script",
    "code",
    "program",
    "cheat",
    "bypass",
  ];

  // Check if any banned topic is mentioned
  for (const topic of bannedTopics) {
    if (lowerText.includes(topic)) {
      return true;
    }
  }

  // If text is very long and doesn't contain any IELTS topics, it might be off-topic
  if (text.length > 100) {
    let containsIELTSTopic = false;
    for (const topic of IELTS_TOPICS) {
      if (lowerText.includes(topic)) {
        containsIELTSTopic = true;
        break;
      }
    }

    if (!containsIELTSTopic) {
      return true;
    }
  }

  return false;
}

// Function to create and initialize a WebRTC connection to OpenAI's API
export async function getOpenaiWebrtcInstance(audioElement: HTMLAudioElement): Promise<{
  pc: RTCPeerConnection;
  dc: RTCDataChannel;
}> {
  // Check if WebRTC is supported
  if (!window.RTCPeerConnection || !navigator.mediaDevices) {
    throw new Error("WebRTC is not supported in this browser");
  }

  // Create RTCPeerConnection with STUN servers
  peerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302",
      },
    ],
  });

  // Create data channel for sending/receiving events
  dataChannel = peerConnection.createDataChannel("oai-events", {
    ordered: true,
  });

  // Set up event listeners for data channel
  dataChannel.onopen = () => {
    console.log("Data channel opened");
  };

  dataChannel.onclose = () => {
    console.log("Data channel closed");
  };

  dataChannel.onerror = error => {
    console.error("Data channel error:", error);
  };

  // Set up audio processing from WebRTC
  peerConnection.ontrack = event => {
    if (event.track.kind === "audio" && event.streams && event.streams[0]) {
      console.log("Received audio track from remote peer");
      audioElement.srcObject = event.streams[0];
      audioElement.play().catch(error => {
        console.error("Failed to play audio:", error);
      });
    }
  };

  // Set up audio input from microphone BEFORE creating the offer
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });

    // Add audio track to peer connection
    stream.getAudioTracks().forEach(track => {
      peerConnection!.addTrack(track, stream);
    });
  } catch (error) {
    console.error("Failed to access microphone:", error);
    throw error;
  }

  // Create an offer to initiate the connection
  await peerConnection.setLocalDescription();

  // Wait for ICE gathering to complete
  const completeOffer = await waitForIceGatheringComplete(peerConnection);

  // Send the offer to our server API route instead of directly to OpenAI
  const response = await fetch("/api/openai", {
    method: "POST",
    body: completeOffer.sdp,
    headers: {
      "Content-Type": "application/sdp",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to establish WebRTC connection");
  }

  const answerSdp = await response.text();

  // Set remote description (OpenAI's answer)
  await peerConnection.setRemoteDescription({
    type: "answer",
    sdp: answerSdp,
  });

  // Wait for connection to be established
  await waitForConnectionState(peerConnection, "connected");

  return { pc: peerConnection, dc: dataChannel };
}

// Helper function to wait for connection state
async function waitForConnectionState(
  pc: RTCPeerConnection,
  state: RTCPeerConnectionState,
): Promise<void> {
  if (pc.connectionState === state) {
    return;
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`Connection timeout. Current state: ${pc.connectionState}`)),
      10000,
    );

    pc.addEventListener("connectionstatechange", () => {
      if (pc.connectionState === state) {
        clearTimeout(timeout);
        resolve();
      } else if (
        pc.connectionState === "failed" ||
        pc.connectionState === "disconnected" ||
        pc.connectionState === "closed"
      ) {
        clearTimeout(timeout);
        reject(new Error(`Connection failed with state: ${pc.connectionState}`));
      }
    });
  });
}

// Helper function to wait for ICE gathering to complete
async function waitForIceGatheringComplete(
  pc: RTCPeerConnection,
): Promise<RTCSessionDescriptionInit> {
  if (pc.iceGatheringState === "complete") {
    return pc.localDescription!;
  }

  return new Promise(resolve => {
    const checkState = () => {
      if (pc.iceGatheringState === "complete") {
        pc.removeEventListener("icegatheringstatechange", checkState);
        resolve(pc.localDescription!);
      }
    };

    pc.addEventListener("icegatheringstatechange", checkState);

    // Timeout after 5 seconds
    setTimeout(() => {
      pc.removeEventListener("icegatheringstatechange", checkState);
      resolve(pc.localDescription!);
    }, 5000);
  });
}

// Function to start a new session with updated instructions
export async function sendSessionUpdate(dc: RTCDataChannel): Promise<void> {
  // Wait for data channel to be open (max 5 seconds)
  if (dc.readyState !== "open") {
    console.log("Waiting for data channel to open...");
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Timeout waiting for data channel to open"));
      }, 5000);

      const checkOpen = () => {
        if (dc.readyState === "open") {
          clearTimeout(timeout);
          resolve();
        }
      };

      // Check immediately
      checkOpen();

      // Set up event listener
      const onOpen = () => {
        checkOpen();
        dc.removeEventListener("open", onOpen);
      };

      dc.addEventListener("open", onOpen);
    }).catch(error => {
      console.error("Data channel connection failed:", error);
      throw error;
    });
  }

  const message = {
    type: "session.update",
    session: {
      instructions: SYSTEM_MESSAGE,
      voice: VOICE,
      input_audio_transcription: { model: "whisper-1" },
      temperature: 0.8,
    },
  };

  dc.send(JSON.stringify(message));
}

// Function to send a text message
export function sendTextMessage(dc: RTCDataChannel, text: string): void {
  if (dc.readyState !== "open") {
    console.error("Data channel not open");
    return;
  }

  // Check if this message indicates the test has ended
  if (detectTestEndPhrases(text)) {
    triggerTestEnded();
  }

  const message = {
    type: "response.create",
    response: {
      modalities: ["text", "audio"],
      content: text,
    },
  };

  dc.send(JSON.stringify(message));
}

// Clear the audio buffer queue
export function clearAudioBuffer(dc: RTCDataChannel): void {
  if (dc.readyState !== "open") {
    console.error("Data channel not open");
    return;
  }

  audioQueue = [];
  isAudioQueueProcessing = false;
}

// Commit the audio buffer to be processed
export function commitAudioBuffer(dc: RTCDataChannel): void {
  if (dc.readyState !== "open") {
    console.error("Data channel not open");
    return;
  }

  const message = {
    type: "input_audio_buffer.commit",
  };

  dc.send(JSON.stringify(message));
}

// Handle audio buffer from microphone
export function handleAudioBuffer(audioChunk: Uint8Array): void {
  audioQueue.push(audioChunk);

  if (!isAudioQueueProcessing) {
    processAudioQueue();
  }
}

// Process audio queue
async function processAudioQueue(): Promise<void> {
  isAudioQueueProcessing = true;

  while (audioQueue.length > 0 && dataChannel?.readyState === "open") {
    const chunk = audioQueue.shift();
    if (chunk && dataChannel) {
      dataChannel.send(chunk);
      // Small delay to prevent overwhelming the data channel
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  isAudioQueueProcessing = false;
}

// Cancel the assistant's current response
export function cancelAssistantResponse(dc: RTCDataChannel): void {
  if (dc.readyState !== "open") {
    console.error("Data channel not open");
    return;
  }

  const message = {
    type: "response.cancel",
  };

  dc.send(JSON.stringify(message));
}

// Handle section transitions
export function handleSectionTransition(dc: RTCDataChannel, sectionNumber: number): void {
  if (dc.readyState !== "open") {
    console.error("Data channel not open");
    return;
  }

  const sectionInstructions =
    {
      1: "Begin with section 1 of the IELTS test: Introduction and General Questions.",
      2: "Transition to section 2 of the IELTS test: Individual Long Turn. Give the candidate a topic and allow them one minute to prepare.",
      3: "Transition to section 3 of the IELTS test: Two-way Discussion related to the section 2 topic. After receiving answers to your questions, inform the candidate that the test is now complete and thank them for their participation.",
    }[sectionNumber] || "";

  // Update sessionStorage with current section
  try {
    const currentDataStr = sessionStorage.getItem("ieltsConversation");
    if (currentDataStr) {
      const currentData = JSON.parse(currentDataStr);
      currentData.currentSection = sectionNumber;
      sessionStorage.setItem("ieltsConversation", JSON.stringify(currentData));
      console.log(`📝 Updated section in sessionStorage: ${sectionNumber}`);
    }
  } catch (error) {
    console.error("Failed to update section in sessionStorage:", error);
  }

  const message = {
    type: "response.create",
    response: {
      modalities: ["text", "audio"],
      instructions: sectionInstructions,
    },
  };

  dc.send(JSON.stringify(message));
}

// Function to analyze an IELTS speaking response
export async function analyzeIELTSSpeaking(transcript: string): Promise<{
  fluencyAndCoherence: number;
  lexicalResource: number;
  grammaticalRangeAndAccuracy: number;
  pronunciation: number;
  overallBand: number;
  feedback: {
    overall: string;
    fluencyAndCoherence: string;
    lexicalResource: string;
    grammaticalRangeAndAccuracy: string;
    pronunciation: string;
  };
}> {
  try {
    // Use OpenAI API to analyze the transcript
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert IELTS speaking examiner. Analyze the following speaking test transcript according to the four IELTS speaking criteria: Fluency and Coherence, Lexical Resource, Grammatical Range and Accuracy, and Pronunciation. Assign a band score (0-9) for each criterion based on the IELTS band descriptors. Then calculate the overall band score (the average of the four scores, rounded to the nearest 0.5). Provide specific feedback for each criterion, highlighting strengths and areas for improvement.`,
          },
          {
            role: "user",
            content: `Here is the IELTS speaking test transcript to analyze:
${transcript}`,
          },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to analyze IELTS speaking: ${response.statusText}`);
    }

    const data = await response.json();
    const analysis = JSON.parse(data.choices[0].message.content);

    return analysis;
  } catch (error) {
    console.error("Error analyzing IELTS speaking:", error);
    // Return default analysis in case of error
    return {
      fluencyAndCoherence: 0,
      lexicalResource: 0,
      grammaticalRangeAndAccuracy: 0,
      pronunciation: 0,
      overallBand: 0,
      feedback: {
        overall: "Unable to analyze the speaking test due to an error.",
        fluencyAndCoherence: "No analysis available.",
        lexicalResource: "No analysis available.",
        grammaticalRangeAndAccuracy: "No analysis available.",
        pronunciation: "No analysis available.",
      },
    };
  }
}

// Clean up and close the connection
export function closeOpenaiConnection(): void {
  if (dataChannel) {
    dataChannel.close();
    dataChannel = null;
  }

  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
}

// Function to detect key phrases indicating test completion
export function detectTestEndPhrases(text: string): boolean {
  const endPhrases = [
    "the test is now complete",
    "thank you for your participation",
    "that concludes the test",
    "that's the end of the test",
    "end of the speaking test",
    "this is the end of the test",
    "we have reached the end of the test",
    "the speaking test is now over",
    "that brings us to the end of the test",
    "we've now finished the test",
  ];

  const lowerText = text.toLowerCase();
  return endPhrases.some(phrase => lowerText.includes(phrase));
}

// Add listener for test ended event
export function onTestEnded(callback: () => void): () => void {
  testEndedListeners.push(callback);

  // Return function to remove the listener
  return () => {
    testEndedListeners = testEndedListeners.filter(listener => listener !== callback);
  };
}

// Trigger test ended event
export function triggerTestEnded(): void {
  if (isTestEnded) return; // Prevent multiple triggers

  console.log("Test ended event triggered");
  isTestEnded = true;

  // Save this information to sessionStorage
  try {
    const currentData = sessionStorage.getItem("ieltsConversation");
    if (currentData) {
      const parsedData = JSON.parse(currentData);
      parsedData.testEnded = true;
      sessionStorage.setItem("ieltsConversation", JSON.stringify(parsedData));
    }
  } catch (error) {
    console.error("Failed to update sessionStorage with test ended status:", error);
  }

  // Notify all listeners
  testEndedListeners.forEach(callback => {
    try {
      callback();
    } catch (error) {
      console.error("Error in test ended listener:", error);
    }
  });
}

// Check if test has ended
export function hasTestEnded(): boolean {
  return isTestEnded;
}

// Utility function to update sessionStorage with transcript data
export function updateTranscriptInSessionStorage(
  text: string,
  role: "examiner" | "candidate",
): void {
  try {
    const currentDataStr = sessionStorage.getItem("ieltsConversation");
    if (!currentDataStr) {
      console.warn("Cannot update transcript: No conversation data found in sessionStorage");
      return;
    }

    const currentData = JSON.parse(currentDataStr);
    const newLine = `${role === "examiner" ? "Examiner" : "Candidate"}: ${text}`;

    // Add to transcript if not already included
    if (!currentData.transcript.includes(newLine)) {
      currentData.transcript += `${newLine}\n`;

      // Update storage
      sessionStorage.setItem("ieltsConversation", JSON.stringify(currentData));
      console.log(
        `✅ Updated transcript in sessionStorage for ${role}: ${text.substring(0, 30)}...`,
      );
    }
  } catch (error) {
    console.error("Failed to update transcript in sessionStorage:", error);
  }
}
