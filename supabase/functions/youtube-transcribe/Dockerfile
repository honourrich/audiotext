FROM supabase/edge-runtime:v1.22.4

# Install yt-dlp and ffmpeg
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && pip3 install yt-dlp \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy function files
COPY . /home/deno/functions/youtube-transcribe
WORKDIR /home/deno/functions/youtube-transcribe

# Set the CMD to run the function
CMD ["start", "--main-service", "/home/deno/functions/youtube-transcribe/index.ts"]