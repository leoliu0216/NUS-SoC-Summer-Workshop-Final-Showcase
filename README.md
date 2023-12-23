# NUS-SoC-Summer-Workshop-Final-Showcase
Cyberpunk-styled Shader Implementation, run on shadertoy website (WebGL). To run the shader properly, you should operate as following instruction:

1. Create BufferA and put the final_showcase.frag to BufferA.

2. Put final_showcase_filter.frag to Image.

3. Open the Browser's console (F12 in Chrome) and input the following codes to it:

''' 
for (let i = 0; i < 4; ++i) {
    d = document.createElement('div');
}
'''

Reference from https://www.shadertoy.com/view/lsGGDd . This codes is aiming at adding custom texture to shadertoy.

5. Click BufferA, then Click iChannel1. Upload the cyberpunk.png in this folder. Then, you can see the right side ball have it's color.
