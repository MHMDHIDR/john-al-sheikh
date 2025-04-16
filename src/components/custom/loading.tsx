export function LoadingPage() {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center w-screen h-screen bg-primary-100 dark:bg-primary-900 z-100000
    [--hue:223]
    [--bg:hsl(var(--hue),_10%,_90%)]
    [--fg:hsl(var(--hue),_10%,_10%)]
    [--primary:hsl(var(--hue),_90%,_55%)] dark:[--primary:hsl(var(--hue),_50%,_75%)]
    [--trans-dur:0.3s]
  "
    >
      <svg
        className="block mx-auto my-6 w-32 h-32 absolute animate-[slide_5s_linear_infinite]"
        role="img"
        aria-label="Shopping cart line animation"
        viewBox="0 0 128 128"
        width="128px"
        height="128px"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="8">
          <g stroke="hsla(0,10%,10%,0.1)">
            <polyline points="4,4 21,4 26,22 124,22 112,64 35,64 39,80 106,80" />
            <circle cx="43" cy="111" r="13" />
            <circle cx="102" cy="111" r="13" />
          </g>
          <g
            className="stroke-[var(--primary)] animate-[cartLines_2s_ease-in-out_infinite]"
            stroke="currentColor"
          >
            <polyline
              className="stroke-[var(--primary)] animate-[cartTop_2s_ease-in-out_infinite]"
              points="4,4 21,4 26,22 124,22 112,64 35,64 39,80 106,80"
              strokeDasharray="338 338"
              strokeDashoffset="-338"
            />
            <g
              className="animate-[cartWheel1_2s_ease-in-out_infinite] rotate-[-0.25turn] origin-[43px_111px]"
              transform="rotate(-90,43,111)"
            >
              <circle
                className="animate-[cartWheelStroke_2s_ease-in-out_infinite]"
                cx="43"
                cy="111"
                r="13"
                strokeDasharray="81.68 81.68"
                strokeDashoffset="81.68"
              />
            </g>
            <g
              className="animate-[cartWheel2_2s_ease-in-out_infinite] rotate-[0.25turn] origin-[102px_111px]"
              transform="rotate(90,102,111)"
            >
              <circle
                className="animate-[cartWheelStroke_2s_ease-in-out_infinite]"
                cx="102"
                cy="111"
                r="13"
                strokeDasharray="81.68 81.68"
                strokeDashoffset="81.68"
              />
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}
