//============================================================================
// PROJECT ID: SWS3005_02
//
// GROUP NUMBER: 2
//
// STUDENT NAME: LI ZENAN
// NUS User ID.: t0930089
//
// STUDENT NAME: SUN HAO
// NUS User ID.: t0930161
//
// STUDENT NAME: LIU TONGHE
// NUS User ID.: t0930344
//
// COMMENTS TO GRADER: -
//
//============================================================================

// FRAGMENT SHADER FOR SHADERTOY
// Run this at https://www.shadertoy.com/new
// See documentation at https://www.shadertoy.com/howto

// Your browser must support WebGL 2.0.
// Check your browser at https://webglreport.com/?v=2


#define DISCO_COLOR 9

const float PI = 3.1415926536;

vec3 BACKGROUND_COLOR = vec3(0.1, 0.3, 1);

// Vertical field-of-view angle of camera. In radians.
const float FOVY = 50.0 * PI / 180.0;

// Use this for avoiding the "epsilon problem" or the shadow acne problem.
const float DEFAULT_TMIN = 10.0e-4;

// Use this for tmax for non-shadow ray intersection test.
const float DEFAULT_TMAX = 10.0e6;

// Equivalent to number of recursion levels (0 means ray-casting only).
// We are using iterations to replace recursions.
const int NUM_ITERATIONS = 2;

// Ray marching for sdf, steps and threshold
const int NUM_MARCHSIZE = 100;
const float MARCH_EPSILO = 10e-5;

// Constants for the scene objects.
const int NUM_LIGHTS = 4;
const int NUM_PLANES = 4;
const int NUM_SPHERES = 8;
const int NUM_Cylinder = 54;

const int NUM_TORUS = 18;
const int TORUS_RING = 18;
const float RING_RAD = 0.015; 
// need to update it once you add some material
const int RING_MATERIAL_START = 16;
// Depends on how many ring we will have
const int NUM_MATERIALS = RING_MATERIAL_START + TORUS_RING;

float blockNum = 1.;
float blockLength = 3.0;

// Cyberpunk mat
const int CYBER_MATERIAL = 15;
const int CYBER_PHERE = 6;
#define CYBER_CHANNEL iChannel1
//============================================================================
// Define new struct types.
//============================================================================
struct Ray_t {
    vec3 o;  // Ray Origin.
    vec3 d;  // Ray Direction. A unit vector.
};

struct Plane_t {
    // The plane equation is Ax + By + Cz + D = 0.
    float A, B, C, D;
    int materialID_1;
    int materialID_2;
    int type; // 0 is for normal plane, 1 is for grid.
};

struct Sphere_t {
    vec3 center;
    float radius;
    int materialID;
};
struct Cylinder_t {
    vec3 vertexA;
    vec3 vertexB;
    float radius;
    int materialID;
};

struct Light_t {
    vec3 position;  // Point light 3D position.
    vec3 I_a;       // For Ambient.
    vec3 I_source;  // For Diffuse and Specular.
};

struct Material_t {
    vec3 k_a;   // Ambient coefficient.
    vec3 k_d;   // Diffuse coefficient.
    vec3 k_r;   // Reflected specular coefficient.
    vec3 k_rg;  // Global reflection coefficient.
    float n;    // The specular reflection exponent. Ranges from 0.0 to 128.0.
};

struct Torus_t {
    vec3 center;    // Center of the Torus.
    float majorRadius;  // Major radius (radius of the tube).
    float minorRadius;  // Minor radius (radius of the torus cross-section).
    mat3 rotationMat;
    int materialID;
};
//----------------------------------------------------------------------------
// The lighting model used here is similar to that shown in
// Lecture Topic B08 (Basic Ray Tracing). Here it is computed as
//
//     I_local = SUM_OVER_ALL_LIGHTS {
//                   I_a * k_a +
//                   k_shadow * I_source * [ k_d * (N.L) + k_r * (R.V)^n ]
//               }
// and
//     I = I_local  +  k_rg * I_reflected
//----------------------------------------------------------------------------


//============================================================================
// Global scene data.
//============================================================================
Plane_t Plane[NUM_PLANES];
Sphere_t Sphere[NUM_SPHERES];
Light_t Light[NUM_LIGHTS];
Material_t Material[NUM_MATERIALS];
Cylinder_t Cylinder[NUM_Cylinder];
Torus_t Torus[NUM_TORUS];

// help function
mat3 rotateY(float r) {
    vec2 cs = vec2(cos(r), sin(r));
    return mat3(cs.x, 0, cs.y, 0, 1, 0, -cs.y, 0, cs.x);
}
mat3 rotateZ(float r) {
    vec2 cs = vec2(cos(r), sin(r));
    return mat3(cs.x, cs.y, 0., -cs.y, cs.x, 0., 0., 0., 1.);
}
mat3 rotateX(float r) {
    vec2 cs = vec2(cos(r), sin(r));
    return mat3(1.0,  0.0,    0.0,
                0.0,  cs.x, -cs.y,
                0.0,  cs.y,  cs.x);
}

void DrawPlane() {
  // Horizontal plane.
    Plane[0].A = 0.0;
    Plane[0].B = 1.0;
    Plane[0].C = 0.0;
    Plane[0].D = 0.0;
    Plane[0].materialID_1 = 0;
    Plane[0].type = 0;
    
    // Vertical plane.
    Plane[1].A = 0.0;
    Plane[1].B = 0.0;
    Plane[1].C = 1.0;
    Plane[1].D = 3.5;
    Plane[1].materialID_1 = 9;
    Plane[1].type = 0;
    // left plane
    Plane[2].A = 1.0;
    Plane[2].B = 0.0;
    Plane[2].C = 0.0;
    Plane[2].D = 5.0;
    Plane[2].materialID_1 = 9;
    Plane[2].type = 0;
    
    // right plane
    Plane[3].A = -1.0;
    Plane[3].B = 0.0;
    Plane[3].C = 0.0;
    Plane[3].D = 12.5;
    Plane[3].materialID_1 = 8;
    Plane[3].materialID_2 = 8;
    Plane[3].type = 1;

}

void DrawSphere() {
 
    Sphere[2].center = vec3( 1.0,0.20, -2.0);
    Sphere[2].radius = 0.2;
    Sphere[2].materialID = 12;
    // sphere in cube
    Sphere[3].center = vec3(1.8, 0.20, 3.0);
    Sphere[3].radius = 0.2;
    Sphere[3].materialID = 4;
    //jumping green ball
    Sphere[4].center = vec3(2.0,0.20+abs(sin(iTime)), -1.0);
    Sphere[4].radius = 0.2;
    Sphere[4].materialID = 3;
    
    //cuber balls
    // Sphere[5].center = vec3(1.5,0.1, 0.2);
    // Sphere[5].radius = 0.1;
    // Sphere[5].materialID = 5;
    
    // change to cyber punk material
    Sphere[6].center = vec3(-1.0, 0.55, 3.0);
    Sphere[6].radius = 0.5;
    Sphere[6].materialID = CYBER_MATERIAL;
    
    //silver balls
    Sphere[7].center = vec3(3, 0.4, 2);
    Sphere[7].radius = 0.3;
    Sphere[7].materialID = 0;
}

void DrawCylinder() {
 //Double quadrangular cone
    vec3 Cylinder_start=vec3(1.414*sin(iTime),0.5+0.3*sin(iTime*3.0+0.6),1.414*cos(iTime))*2.0;
    for(int i=0;i<12;i++)
    {
        Cylinder[i].materialID = 11;
        Cylinder[i].radius=0.02;
    }
   Cylinder[0].vertexA =  Cylinder_start;
    Cylinder[0].vertexB = Cylinder_start+vec3(0.618*sin(iTime),1.0,0.618*cos(iTime)); 
    
    
    Cylinder[1].vertexA = Cylinder_start; 
    Cylinder[1].vertexB = Cylinder_start+vec3(0.618*sin(iTime+PI/2.0),1.0,0.618*cos(iTime+PI/2.0)); 
    
    
    Cylinder[2].vertexA = Cylinder_start; 
    Cylinder[2].vertexB = Cylinder_start+vec3(0.618*sin(iTime+PI),1.0,0.618*cos(iTime+PI)); 
    
    
    Cylinder[3].vertexA = Cylinder_start; 
    Cylinder[3].vertexB = Cylinder_start+vec3(0.618*sin(iTime+PI*3.0/2.0),1.0,0.618*cos(iTime+PI*3.0/2.0)); 
    
    
    Cylinder[4].vertexA = Cylinder_start+vec3(0.618*sin(iTime),1.0,0.618*cos(iTime)); 
    Cylinder[4].vertexB = Cylinder_start+vec3(0.0,2.0,0.0); 
    
    Cylinder[5].vertexA = Cylinder_start+vec3(0.618*sin(iTime+PI/2.0),1.0,0.618*cos(iTime+PI/2.0)); 
    Cylinder[5].vertexB = Cylinder_start+vec3(0.0,2.0,0.0); 
    
    Cylinder[6].vertexA = Cylinder_start+vec3(0.618*sin(iTime+PI),1.0,0.618*cos(iTime+PI)); 
    Cylinder[6].vertexB = Cylinder_start+vec3(0.0,2.0,0.0); 
    
    Cylinder[7].vertexA = Cylinder_start+vec3(0.618*sin(iTime+PI*3.0/2.0),1.0,0.618*cos(iTime+PI*3.0/2.0)); 
    Cylinder[7].vertexB = Cylinder_start+vec3(0.0,2.0,0.0); 
    
    Cylinder[8].vertexA = Cylinder_start+vec3(0.618*sin(iTime),1.0,0.618*cos(iTime)); 
    Cylinder[8].vertexB = Cylinder_start+vec3(0.618*sin(iTime+PI/2.0),1.0,0.618*cos(iTime+PI/2.0)); 
    
    Cylinder[9].vertexA = Cylinder_start+vec3(0.618*sin(iTime),1.0,0.618*cos(iTime)); 
    Cylinder[9].vertexB = Cylinder_start+vec3(0.618*sin(iTime-PI/2.0),1.0,0.618*cos(iTime-PI/2.0)); 
    
    Cylinder[10].vertexA = Cylinder_start+vec3(0.618*sin(iTime+PI),1.0,0.618*cos(iTime+PI)); 
    Cylinder[10].vertexB = Cylinder_start+vec3(0.618*sin(iTime-PI/2.0),1.0,0.618*cos(iTime-PI/2.0)); 
    
    Cylinder[11].vertexA = Cylinder_start+vec3(0.618*sin(iTime+PI),1.0,0.618*cos(iTime+PI)); 
    Cylinder[11].vertexB = Cylinder_start+vec3(0.618*sin(iTime+PI/2.0),1.0,0.618*cos(iTime+PI/2.0)); 
    for(int i=0;i<12;i++)
    {
        Cylinder[i].vertexA*=0.5;
        Cylinder[i].vertexB*=0.5;
    }
    
    //Regular icosahedron 
    vec3 icosahedroncenter=vec3(0.0,1.0,0.0);
    vec3 icosahedronVetex[12];
    float m=0.52573111211913360602566908484788;
    float n=0.85065080835203993218154049706301;
    mat3 R = mat3 (cos(iTime), 0.0, sin(iTime),
                    0.0, 1.0, 0.0,
                    -sin(iTime), 0.0, cos(iTime));
    icosahedronVetex[0]=icosahedroncenter+R*vec3(m,0.0,n);
    icosahedronVetex[1]=icosahedroncenter+R*vec3(m,0.0,-n);
    icosahedronVetex[2]=icosahedroncenter+R*vec3(-m,0.0,n);
    icosahedronVetex[3]=icosahedroncenter+R*vec3(-m,0.0,-n);
    
    icosahedronVetex[4]=icosahedroncenter+R*vec3(0.0,n,m);
    icosahedronVetex[5]=icosahedroncenter+R*vec3(0.0,n,-m);
    icosahedronVetex[6]=icosahedroncenter+R*vec3(0.0,-n,m);
    icosahedronVetex[7]=icosahedroncenter+R*vec3(0.0,-n,-m);
    
    icosahedronVetex[8]=icosahedroncenter+R*vec3(n,m,0.0);
    icosahedronVetex[9]=icosahedroncenter+R*vec3(n,-m,0.0);
    icosahedronVetex[10]=icosahedroncenter+R*vec3(-n,m,0.0);
    icosahedronVetex[11]=icosahedroncenter+R*vec3(-n,-m,0.0);
    int num = 12;
    // Draw 12 width
   for(int i=0;i<12;i++)
    {
        for(int j=0;j<i;j++)
        {
            vec3 tem=(icosahedronVetex[i]+icosahedronVetex[j])/2.0;
            tem=tem-icosahedroncenter;

            if(length(tem)>0.85)
            {
                Cylinder[num].vertexA =  icosahedronVetex[i];
                Cylinder[num].vertexB = icosahedronVetex[j];
                Cylinder[num].materialID = 11;
                Cylinder[num].radius=0.05;
                num += 1;
            }
        }
    }
    
    // Center bouncing sphere.
    Sphere[0].center = vec3( 0.0,1.0, 0.0 );
    Sphere[0].radius = 0.45;
    Sphere[0].materialID = 12;

    // Circling sphere.
    Sphere[1].center = Cylinder_start*0.5+vec3(0.0,0.5,0.0);
    Sphere[1].radius = 0.15;
    Sphere[1].materialID = 13;
    
    //draw cube
    float a=1.0;
    vec3 cubecenter=vec3(3.6,a/2.0,6.0);
    vec3 cubevertex[8];
    
    cubevertex[0]=(cubecenter+vec3(a/2.0,a/2.0,a/2.0))*0.5;
    cubevertex[1]=(cubecenter+vec3(a/2.0,a/2.0,-a/2.0))*0.5;
    cubevertex[2]=(cubecenter+vec3(-a/2.0,a/2.0,a/2.0))*0.5;
    cubevertex[3]=(cubecenter+vec3(-a/2.0,a/2.0,-a/2.0))*0.5;
    
    cubevertex[4]=(cubecenter+vec3(a/2.0,-a/2.0,+a/2.0))*0.5;
    cubevertex[5]=(cubecenter+vec3(a/2.0,-a/2.0,-a/2.0))*0.5;
    cubevertex[6]=(cubecenter+vec3(-a/2.0,-a/2.0,+a/2.0))*0.5;
    cubevertex[7]=(cubecenter+vec3(-a/2.0,-a/2.0,-a/2.0))*0.5;
    
  //  num = num + 1;
    // draw cube
    for(int i=0;i<8;i++){
        for(int j=0;j<i;j++)
        {
            vec3 tem=(cubevertex[i]+ cubevertex[j])/2.0;
            tem=tem- cubecenter*0.5;

            if(length(tem)>0.7*0.5)
            {
                Cylinder[num].vertexA =  cubevertex[i];
                Cylinder[num].vertexB =  cubevertex[j];
                Cylinder[num].materialID = 11;
                Cylinder[num].radius=0.03;
                num = num + 1;
            }
            
        }
    }
}


void DrawTorus() {
    // Init ring.
    vec3 ring_center = vec3(3.8, 1.2 ,1.2);
    float large_r = float(TORUS_RING) * RING_RAD + 0.33;
    float outter_line = large_r;
    float t = iTime*.35;

    // Define ring color.
    // vec3 outer_color = vec3(0.788, 0.392, 0.653); // neopink
    // vec3 inner_color = vec3(0.0, 0.0, 0.3);     // dark blue
    
    vec3 inner_color = vec3(0.0, 0.6, 0.3);    // dark blue
    vec3 outer_color = vec3(1.0, 0.9, 0.0); // yellow
    
    for(int i=0; i < TORUS_RING; i++) {
        
        int matIdx = RING_MATERIAL_START + i;
        
        vec3 interpolatedColor = mix(outer_color, inner_color, large_r/outter_line);
        vec3 clampedColor = clamp(interpolatedColor, vec3(0.0), vec3(1.0));

        Material[matIdx].k_d = clampedColor;
        Material[matIdx].k_a = 0.2 * mix(clampedColor, inner_color, 0.5);
        Material[matIdx].k_r = 2.0 * outer_color;
        Material[matIdx].k_rg = 0.5 * Material[matIdx].k_d;
        Material[matIdx].n = 32.0;
    
        // set ring.
        Torus[i].center = ring_center;
        Torus[i].majorRadius = large_r;
        Torus[i].minorRadius = RING_RAD;
        
        // rot ring.
        Torus[i].rotationMat = i ==0 ?  rotateZ(t) * rotateY(t*.5) : 
                                 Torus[i-1].rotationMat * rotateZ(t) * rotateY(t*.5);
        Torus[i].materialID = matIdx;
        large_r -= RING_RAD * 2.2;
    }
}


/////////////////////////////////////////////////////////////////////////////
// Initializes the scene.
/////////////////////////////////////////////////////////////////////////////
void InitScene()
{
//Double quadrangular cone
   
    
    DrawCylinder();
    DrawPlane();
    DrawSphere();
    DrawTorus();
    
    
    // Silver material.
    Material[0].k_d = vec3( 0.5, 0.5, 0.5 );
    Material[0].k_a = 0.2 * Material[0].k_d;
    Material[0].k_r = 2.0 * Material[0].k_d;
    Material[0].k_rg = 0.9 * Material[0].k_r;
    Material[0].n = 64.0;

    // Gold material.
    Material[1].k_d = vec3( 0.8, 0.7, 0.1 );
    Material[1].k_a = 0.2 * Material[1].k_d;
    Material[1].k_r = 2.0 * Material[1].k_d;
    Material[1].k_rg = 0.5 * Material[1].k_r;
    Material[1].n = 64.0;

    //green shining material
    Material[2].k_d = vec3( 0.0, 20, 0.0 );
    Material[2].k_a = 0.2 *Material[2].k_d;
    Material[2].k_r = 0.3*Material[2].k_d;
    Material[2].k_rg = 0.1*Material[2].k_d;
    Material[2].n = 128.0;

    //Copper material
    Material[3].k_d = vec3(0.8, 0.4, 0.1);
    Material[3].k_a = vec3(0.1, 0.9, 0.1);
    Material[3].k_r = vec3(0.9, 0.1, 0.9); ;
    Material[3].k_rg = vec3(0.9, 0.1, 0.9);;
    Material[3].n = 15.0;
    
    //Red diomand
    Material[4].k_d = vec3( 0.614240, 0.041360, 0.041360 );
    Material[4].k_a = vec3( 0.174500, 0.011750, 0.011750 );
    Material[4].k_r = vec3( 0.727811, 0.626959, 0.626959 );
    Material[4].k_rg = vec3( 0.550000, 0.550000, 0.550000);
    Material[4].n = 128.0;
    
    //pearl
    Material[5].k_d = vec3( 1.000000, 0.829000, 0.829000 );
    Material[5].k_a = vec3( 0.250000, 0.207250, 0.207250 );
    Material[5].k_r = vec3( 0.296648, 0.296648, 0.296648 );
    Material[5].k_rg = 0.4 * Material[5].k_r;
    Material[5].n = 128.0;
    
    //Bronze
    Material[6].k_d = vec3( 0.714000, 0.428400, 0.181440 );
    Material[6].k_a = vec3( 0.212500, 0.127500, 0.054000 );
    Material[6].k_r = vec3( 0.393548, 0.271906, 0.166721 );
    Material[6].k_rg = 0.4 * Material[6].k_r;
    Material[6].n = 128.0;
    
    //violet
    Material[7].k_d = vec3( 161.0, 72.0, 66.0 )/255.0;
    Material[7].k_a =  0.2 * Material[6].k_d;
    Material[7].k_r =  2.0 * Material[6].k_d;
    Material[7].k_rg = 0.5 * Material[6].k_r;
    Material[7].n = 128.0;
    
    //black
    Material[8].k_d = vec3( 0., 0., 0. );
    Material[8].k_a = vec3( 0.110000, 0.060000, 0.090000 );
    Material[8].k_r = vec3( 0.330000, 0.330000, 0.520000 );
    Material[8].k_rg = 0.4 * Material[8].k_r;
    Material[8].n = 128.0;
    
    //special
    Material[9].k_d = vec3( 0., 0., 0. );
    Material[9].k_a = vec3( 0.0, 0.0, 0.0 );
    Material[9].k_r = vec3( 0.0, 0.0, 0.0 );
    Material[9].k_rg = 0.4 * Material[9].k_r;
    Material[9].n = 128.0;
    
    // Silver material.
    Material[10].k_d = vec3( 0.5, 0.5, 0.5 );
    Material[10].k_a = 0.2 * Material[0].k_d;
    Material[10].k_r = 2.0 * Material[0].k_d;
    Material[10].k_rg = 0.5 * Material[0].k_r;
    Material[10].n = 128.0;

    //black material 3-->11
    Material[11].k_d = vec3(0.11, 0.11, 0.11);
    Material[11].k_a =  0.2 * Material[3].k_d;
    Material[11].k_r =  2.0 * Material[3].k_d;
    Material[11].k_rg = 0.8 * Material[3].k_r;
    Material[11].n = 128.0;
    
    //blue shining material 4-->12
    Material[12].k_d = vec3(0, 5,5) ;
    Material[12].k_a = 0.3 * Material[4].k_d;
    Material[12].k_r = 0.8 * Material[4].k_d;
    Material[12].k_rg = 0.20 * Material[4].k_r;
    Material[12].n = 60.0;
    
    //red shining material 5-->13
    Material[13].k_d = vec3(255, 0.0, 0.0 );
    Material[13].k_a = 0.2 * Material[5].k_d;
    Material[13].k_r = vec3( 1.0, 1.0, 1.0 );
    Material[13].k_rg = 0.5 * Material[5].k_r;
    Material[13].n = 128.0;
    //red shining material 5-->13
    Material[14].k_d = vec3(255, 0.0, 0.0 );
    Material[14].k_a = 0.2 * Material[5].k_d;
    Material[14].k_r = vec3( 1.0, 1.0, 1.0 );
    Material[14].k_rg = 0.5 * Material[5].k_r;
    Material[14].n = 128.0;
    
    // vec4 texColor = texture(iChannel1, fragCoord);
    // cyber punk material
    Material[15].k_d = vec3(1.0, 1.0, 1.0);   // Diffuse coefficient
    Material[15].k_a = vec3(0.1, 0.1, 0.1);   // Ambient coefficient
    Material[15].k_r = vec3(1.0, 1.0, 1.0);   // Reflected specular coefficient
    Material[15].k_rg = vec3(0.1, 0.1, 0.1);  // Global reflection coefficient
    Material[15].n = 32.0;                   // Specular reflection exponent

 // Lighting Coeffecient
    float lightCoeff = 1.0 / 15.5;

    // Light 1
    Light[0].position = vec3(2.0*cos(1.1*iTime)+0.5, 8.0, 2.0*sin(1.1*iTime)+2.0) * 1.2;
    Light[0].I_a      = vec3(7.0, 1.0, 4.0) * lightCoeff;
    Light[0].I_source = vec3(7.0, 1.0, 4.0) * lightCoeff;

    // Light 2.
    Light[1].position = vec3(2.0*cos(1.1*iTime+PI*0.667)+0.5, 8.0, 2.0*sin(1.1*iTime+PI*0.667)+2.0) * 1.2;
    Light[1].I_a      = vec3(1.0, 4.0, 7.0) * lightCoeff;
    Light[1].I_source = vec3(1.0, 4.0, 7.0) * lightCoeff;

    // Light 3.
    Light[2].position = vec3(2.0*cos(1.1*iTime+PI*1.333)+0.5, 8.0, 2.0*sin(1.1*iTime+PI*1.333)+2.0) * 1.2;
    Light[2].I_a      = vec3(4.0, 7.0, 1.0) * lightCoeff;
    Light[2].I_source = vec3(4.0, 7.0, 1.0) * lightCoeff;
}



/////////////////////////////////////////////////////////////////////////////
// Computes intersection between a plane and a ray.
// Returns true if there is an intersection where the ray parameter t is
// between tmin and tmax, otherwise returns false.
// If there is such an intersection, outputs the value of t, the position
// of the intersection (hitPos) and the normal vector at the intersection
// (hitNormal).
/////////////////////////////////////////////////////////////////////////////
bool IntersectPlane( in Plane_t pln, in Ray_t ray, in float tmin, in float tmax,
                     out float t, out vec3 hitPos, out vec3 hitNormal )
{
    vec3 N = vec3( pln.A, pln.B, pln.C );
    float NRd = dot( N, ray.d );
    float NRo = dot( N, ray.o );
    float t0 = (-pln.D - NRo) / NRd;
    if ( t0 < tmin || t0 > tmax ) return false;

    // We have a hit -- output results.
    t = t0;
    hitPos = ray.o + t0 * ray.d;
    hitNormal = normalize( N );
    return true;
}



/////////////////////////////////////////////////////////////////////////////
// Computes intersection between a plane and a ray.
// Returns true if there is an intersection where the ray parameter t is
// between tmin and tmax, otherwise returns false.
/////////////////////////////////////////////////////////////////////////////
bool IntersectPlane( in Plane_t pln, in Ray_t ray, in float tmin, in float tmax )
{
    vec3 N = vec3( pln.A, pln.B, pln.C );
    float NRd = dot( N, ray.d );
    float NRo = dot( N, ray.o );
    float t0 = (-pln.D - NRo) / NRd;
    if ( t0 < tmin || t0 > tmax ) return false;
    return true;
}



/////////////////////////////////////////////////////////////////////////////
// Computes intersection between a sphere and a ray.
// Returns true if there is an intersection where the ray parameter t is
// between tmin and tmax, otherwise returns false.
// If there is one or two such intersections, outputs the value of the
// smaller t, the position of the intersection (hitPos) and the normal
// vector at the intersection (hitNormal).
/////////////////////////////////////////////////////////////////////////////
bool IntersectSphere( in Sphere_t sph, in Ray_t ray, in float tmin, in float tmax,
                      out float t, out vec3 hitPos, out vec3 hitNormal )
{
vec3 oc = ray.o - sph.center;
    float a = dot(ray.d, ray.d);
    float b = 2.0 * dot(oc, ray.d);
    float c = dot(oc, oc) - sph.radius * sph.radius;
    float discriminant = b * b - 4.0 * a * c;

    if(discriminant < 0.0) {
        return false;
    }

    float temp = (-b - sqrt(discriminant)) / (2.0 * a);
    if(temp > tmin && temp < tmax) {
        t = temp;
        hitPos = ray.o + t * ray.d;
        hitNormal = (hitPos - sph.center) / sph.radius;
        return true;
    }

    temp = (-b + sqrt(discriminant)) / (2.0 * a);
    if(temp > tmin && temp < tmax) {
        t = temp;
        hitPos = ray.o + t * ray.d;
        hitNormal = (hitPos - sph.center) / sph.radius;
        return true;
    }

    return false;
}



/////////////////////////////////////////////////////////////////////////////
// Computes intersection between a sphere and a ray.
// Returns true if there is an intersection where the ray parameter t is
// between tmin and tmax, otherwise returns false.
/////////////////////////////////////////////////////////////////////////////
bool IntersectSphere( in Sphere_t sph, in Ray_t ray, in float tmin, in float tmax )
{
    /////////////////////////////////
    // TASK: WRITE YOUR CODE HERE. //
    /////////////////////////////////
     vec3 oc = ray.o - sph.center; 

    float a = dot(ray.d, ray.d); 
    float b = 2.0f * dot(oc, ray.d);
    float c = dot(oc, oc) - sph.radius * sph.radius;

    float discriminant = b * b - 4.0 * a * c; 
    if (discriminant < 0.0) 
    {
        return false; 
    } 
    else 
    {
        float t = (-b - sqrt(discriminant)) / (2.0f * a);
        if (t < tmin) t = (-b + sqrt(discriminant)) / (2.0f * a);
        if (t < tmin || t > tmax) return false;
        //recT = t;
        return true; 
    }


   // return false;

}

/////////////////////////////////////////////////////////////////////////////
// Computes intersection between a stick and a ray.
// Returns true if there is an intersection where the ray parameter t is
// between tmin and tmax, otherwise returns false.
// If there is one or two such intersections, outputs the value of the
// smaller t, the position of the intersection (hitPos) and the normal
// vector at the intersection (hitNormal).
/////////////////////////////////////////////////////////////////////////////

// copied from https://www.shadertoy.com/view/Xt3SzX
float capIntersect( in vec3 ro, in vec3 rd, in vec3 pa, in vec3 pb, in float r )
{
    vec3  ba = pb - pa;
    vec3  oa = ro - pa;

    float baba = dot(ba,ba);
    float bard = dot(ba,rd);
    float baoa = dot(ba,oa);
    float rdoa = dot(rd,oa);
    float oaoa = dot(oa,oa);

    float a = baba      - bard*bard;
    float b = baba*rdoa - baoa*bard;
    float c = baba*oaoa - baoa*baoa - r*r*baba;
    float h = b*b - a*c;
    if( h>=0.0 )
    {
        float t = (-b-sqrt(h))/a;
        float y = baoa + t*bard;
        // body
        if( y>0.0 && y<baba ) return t;
        // caps
        vec3 oc = (y<=0.0) ? oa : ro - pb;
        b = dot(rd,oc);
        c = dot(oc,oc) - r*r;
        h = b*b - c;
        if( h>0.0 ) return -b - sqrt(h);
    }
    return -1.0;
}

vec3 capNormal( in vec3 pos, in vec3 a, in vec3 b, in float r )
{
    vec3  ba = b - a;
    vec3  pa = pos - a;
    float h = clamp(dot(pa,ba)/dot(ba,ba),0.0,1.0);
    return (pa - h*ba)/r;
}

bool IntersectCylinder( in Cylinder_t stk, in Ray_t ray, in float tmin, in float tmax,
                      out float t, out vec3 hitPos, out vec3 hitNormal )
{
    t = capIntersect( ray.o, ray.d, stk.vertexA, stk.vertexB, stk.radius );

    if (t >= 0.0 && t <= tmax){
        hitPos = ray.o + t * ray.d;
        hitNormal = capNormal(hitPos, stk.vertexA, stk.vertexB, stk.radius);
        return true;
    } else {
        return false;
    }
}


/////////////////////////////////////////////////////////////////////////////
// Computes intersection between a stick and a ray.
// Returns true if there is an intersection where the ray parameter t is
// between tmin and tmax, otherwise returns false.
/////////////////////////////////////////////////////////////////////////////
bool IntersectCylinder( in Cylinder_t stk, in Ray_t ray, in float tmin, in float tmax)
{
    float t = capIntersect( ray.o, ray.d, stk.vertexA, stk.vertexB, stk.radius );
    if (t >= 0.0 && t >= tmin && t <= tmax){
        return true;
    } else {
        return false;
    }
}

// Function to calculate the distance from a point to the nearest point on the torus
float sdTorus(vec3 point, Torus_t torus) {
    // Transform the point into the torus local space using the rotationMat
    vec3 local_point = transpose(torus.rotationMat) * (point - torus.center);

    // Calculate the distance to the torus surface
    float x = length(local_point.xy) - torus.majorRadius;
    float torus_distance = length(vec2(x, local_point.z)) - torus.minorRadius;

    return torus_distance;
}

// calculate SDF
bool torusRayIntersection(in Ray_t ray, Torus_t torus, in float tmin, in float tmax, 
                            out float t, out vec3 hitPos, out vec3 hitNormal) {
    vec3 origin = ray.o, direction = ray.d;
    // Ray marching loop
    float accumulated_distance = 0.0;
    for (int i = 0; i < NUM_MARCHSIZE; i++) {
        vec3 current_position = origin + direction * accumulated_distance;

        // Calculate the distance to the nearest point on the torus
        float torus_distance = sdTorus(current_position, torus);

        // Update the accumulated distance
        accumulated_distance += torus_distance;

        // Check for intersection conditions
        if (accumulated_distance > tmax || torus_distance < tmin) {
            break;
        }
    }

    // Check if there was no intersection
    if (accumulated_distance > tmax ) {
        return false; // No intersection
    }
    t = accumulated_distance;

    hitPos = origin + direction * accumulated_distance;
   
    // calculate normal
    float paramSquared = torus.minorRadius * torus.minorRadius + 
                            torus.majorRadius * torus.majorRadius;

    vec3 localPos = transpose(torus.rotationMat) * ( hitPos - torus.center);

    // close calculate
    vec3 close_normal = vec3(
        sdTorus(hitPos + vec3(MARCH_EPSILO, 0, 0), torus) - sdTorus(hitPos - vec3(MARCH_EPSILO, 0, 0), torus),
        sdTorus(hitPos + vec3( 0,MARCH_EPSILO, 0), torus) - sdTorus(hitPos - vec3(0,MARCH_EPSILO,  0), torus),
        sdTorus(hitPos + vec3( 0, 0, MARCH_EPSILO), torus) - sdTorus(hitPos - vec3(0,  0, MARCH_EPSILO), torus)
    );

    hitNormal =  normalize(close_normal);
    return true;
}

bool IntersectTorus(in Torus_t torus, in Ray_t ray, in float tmin, in float tmax) {
    vec3 origin = ray.o, direction = ray.d;
    // Ray marching loop
    float torus_distance = 0.0;
    float accumulated_distance = 0.0;
    for (int i = 0; i < NUM_MARCHSIZE; i++) {
        vec3 current_position = origin + direction * accumulated_distance;
        // Calculate the distance to the nearest point on the torus
         torus_distance = sdTorus(current_position, torus);
        // Update the accumulated distance
        accumulated_distance += torus_distance;

        // Check for intersection conditions
        if (torus_distance < tmin) {
            return true;
        } else if(accumulated_distance >= tmax) return false;
    }

    return false;
}


/////////////////////////////////////////////////////////////////////////////
// Computes (I_a * k_a) + k_shadow * I_source * [ k_d * (N.L) + k_r * (R.V)^n ].
// Input vectors L, N and V are pointing AWAY from surface point.
// Assume all vectors L, N and V are unit vectors.
/////////////////////////////////////////////////////////////////////////////
vec3 PhongLighting( in vec3 L, in vec3 N, in vec3 V, in bool inShadow,
                    in Material_t mat, in Light_t light )
{
    if ( inShadow ) {
        return light.I_a * mat.k_a;
    }
    else {
        vec3 R = reflect( -L, N );
        float N_dot_L = max( 0.0, dot( N, L ) );
        float R_dot_V = max( 0.0, dot( R, V ) );
        float R_dot_V_pow_n = ( R_dot_V == 0.0 )? 0.0 : pow( R_dot_V, mat.n );

        return light.I_a * mat.k_a +
               light.I_source * (mat.k_d * N_dot_L + mat.k_r * R_dot_V_pow_n);
    }
}


// Reference: https://www.shadertoy.com/view/XdB3Dw
vec3 squaresColours(vec2 p)
{
	p+=vec2(iTime*0.2);
	
	//vec3 orange=vec3(1.0,0.4,0.1)*2.0;
	//vec3 purple=vec3(1.0,0.2,0.5)*0.8;
    vec3 orange=vec3(0.0, 0.0,0.3);
	vec3 purple=vec3(1.0, 0.6, 0.8)*0.8;

	float l=pow(0.5+0.5*cos(p.x*7.0+cos(p.y)*8.0)*sin(p.y*2.0),4.0)*2.0;
	vec3 c=pow(l*(mix(orange,purple,0.5+0.5*cos(p.x*40.0+sin(p.y*10.0)*3.0))+
				  mix(orange,purple,0.5+0.5*cos(p.x*20.0+sin(p.y*3.0)*3.0))),vec3(1.2))*0.7;
	
	c+=purple * pow(0.5+0.5*cos(p.x*20.0)*sin(p.y*12.0),20.0)*2.0;
	
	c+=vec3(0.5+0.5*cos(p*20.0).x ,0.1, 0.5+0.5*cos(p*20.0).y )*vec3(0.1,0.0,0.2).bgr*0.7;
	
	return c;
}

vec3 calculateColor(vec2 p,float border){
    float sm=0.02;
	vec2 res=vec2(3.5);
	vec2 ip=floor(p*res)/res;
	vec2 fp=fract(p*res);
	float m=1.0-max(smoothstep(border-sm,border,abs(fp.x-0.5)),smoothstep(border-sm,border,abs(fp.y-0.5)));
	m+=1.0-smoothstep(0.0,0.56,distance(fp,vec2(0.5)));
	return m*squaresColours(ip);
}


// Plane Phong lighting
vec3 PhongLighting( in vec3 L, in vec3 N, in vec3 V, in bool inShadow,
                    in Light_t light, vec3 nearest_hitPos, int hitWhichPlane )
{
    Material_t mat = Material[1];
    vec2 p, intPart;
    float countIntPart;
    if(hitWhichPlane == 0 || hitWhichPlane == 5) p = nearest_hitPos.xz;
    else if(hitWhichPlane == 1 || hitWhichPlane == 3) p = nearest_hitPos.xy;
    else if(hitWhichPlane == 2 || hitWhichPlane == 4) p = nearest_hitPos.yz;
    else if(hitWhichPlane < 0){p.y = nearest_hitPos.y; p.x = length(nearest_hitPos.xz);}
    p = p / blockNum;
    mat.k_d = calculateColor(p, blockLength);
    mat.k_a = 0.3 * mat.k_d;
    mat.k_r = 3.0 * mat.k_d;

    if ( inShadow ) {
        return light.I_a * mat.k_a;
    }
    else {
        vec3 R = reflect( -L, N );
        float N_dot_L = max( 0.0, dot( N, L ) );
        float R_dot_V = max( 0.0, dot( R, V ) );
        float R_dot_V_pow_n = ( R_dot_V == 0.0 )? 0.0 : pow( R_dot_V, mat.n );

        return light.I_a * mat.k_a +
               light.I_source * (mat.k_d * N_dot_L + mat.k_r * R_dot_V_pow_n);
    }
}

//////////////////////////////////////////////////
// Reference https://www.shadertoy.com/view/lsGGDd
// Sphere TExture Lighting when calculating a custom texture
//////////////////////////////////////////////////
vec3 SphereTextureLighting(in Sphere_t sph, in vec3 hitPos, in vec3 L, in vec3 N, in vec3 V, 
                            in bool inShadow, in Light_t light, in Material_t mat) {
    // calculate uv;
    float u = 1.0-atan(N.z, N.x) / (2.0*PI);
	float v = 1.0-(atan(length(N.xz), N.y)) / PI;
    
    // yellow lighting
    vec3 glowColor = vec3(1.0 + 0.2 * sin(iTime * 3.), 
                         1.0 + 0.2 * sin(iTime * 3.0), 0.0); 
    float intensity = (1.0 + 0.3 * sin(iTime*2.0));

    // calculate texture color
    mat.k_d =  texture(CYBER_CHANNEL, vec2(u + iTime * 0.2, v)).rgb 
               * intensity     ;

    mat.k_r = mat.k_r * mat.k_d * intensity;
    mat.k_rg = mat.k_rg * mat.k_d * intensity;
    mat.k_a = vec3(1., 1., 1.) * mat.k_d * intensity;

     if ( inShadow ) {
        return light.I_a * mat.k_a;
    }
    else {
        vec3 R = reflect( -L, N );
        float N_dot_L = max( 0.0, dot( N, L ) );
        float R_dot_V = max( 0.0, dot( R, V ) );
        float R_dot_V_pow_n = ( R_dot_V == 0.0 )? 0.0 : pow( R_dot_V, mat.n );

        return light.I_a * mat.k_a +
               light.I_source * (mat.k_d * N_dot_L + mat.k_r * R_dot_V_pow_n);
    }
}


/////////////////////////////////////////////////////////////////////////////
// Casts a ray into the scene and returns color computed at the nearest
// intersection point. The color is the sum of light from all light sources,
// each computed using Phong Lighting Model, with consideration of
// whether the interesection point is being shadowed from the light.
// If there is no interesection, returns the background color, and outputs
// hasHit as false.
// If there is intersection, returns the computed color, and outputs
// hasHit as true, the 3D position of the intersection (hitPos), the
// normal vector at the intersection (hitNormal), and the k_rg value
// of the material of the intersected object.
/////////////////////////////////////////////////////////////////////////////
vec3 CastRay( in Ray_t ray,
              out bool hasHit, out vec3 hitPos, out vec3 hitNormal, out vec3 k_rg )
{
    // Find whether and where the ray hits some object.
    // Take the nearest hit point.

    bool hasHitSomething = false;
    float nearest_t = DEFAULT_TMAX;   // The ray parameter t at the nearest hit point.
    vec3 nearest_hitPos;              // 3D position of the nearest hit point.
    vec3 nearest_hitNormal;           // Normal vector at the nearest hit point.
    int nearest_hitMatID;             // MaterialID of the object at the nearest hit point.

    float temp_t;
    vec3 temp_hitPos;
    vec3 temp_hitNormal;
    bool temp_hasHit;
    
    int hitWhichPlane;

    /////////////////////////////////////////////////////////////////////////////
    // TASK:
    // * Try interesecting input ray with all the planes and spheres,
    //   and record the front-most (nearest) interesection.
    // * If there is interesection, need to record hasHitSomething,
    //   nearest_t, nearest_hitPos, nearest_hitNormal, nearest_hitMatID.
    /////////////////////////////////////////////////////////////////////////////

    /////////////////////////////////
    // TASK: WRITE YOUR CODE HERE. //
    /////////////////////////////////
    for (int i = 0; i < NUM_PLANES; i++)
    {
        temp_hasHit = IntersectPlane(Plane[i], ray, DEFAULT_TMIN, DEFAULT_TMAX, temp_t, temp_hitPos, temp_hitNormal);
        
        // If hit, set hasHitSomething as true,
        // and update the information of front-most (nearest) interesection.
        if (temp_hasHit && temp_t < nearest_t)
        {
            hasHitSomething = true;
            nearest_t = temp_t;
            nearest_hitPos = temp_hitPos;
            nearest_hitNormal = temp_hitNormal;
            if(Plane[i].type == 1)
            {
                float tempX = mod(nearest_hitPos.x,5.)-2.5;
                float tempZ = mod(nearest_hitPos.z,5.)-2.5;
                if(tempX*tempZ<0.)
                    nearest_hitMatID = Plane[i].materialID_1;
                else
                    nearest_hitMatID = Plane[i].materialID_2;
            }
            else
                nearest_hitMatID = Plane[i].materialID_1;
            hitWhichPlane = i;
        }
    }
        
    for(int sphereIdx = 0; sphereIdx < NUM_SPHERES; sphereIdx++)
    {
        if( IntersectSphere(Sphere[sphereIdx], ray, DEFAULT_TMIN, nearest_t, temp_t, temp_hitPos, temp_hitNormal) )
        {
            nearest_t = temp_t;
            nearest_hitPos = temp_hitPos;
            nearest_hitNormal = temp_hitNormal;
            nearest_hitMatID = Sphere[sphereIdx].materialID;
            hasHitSomething = true;
        }
    }
    for (int i = 0; i < NUM_Cylinder; i++){
        if (IntersectCylinder(Cylinder[i], ray, DEFAULT_TMIN,nearest_t,temp_t,temp_hitPos,temp_hitNormal)){
            hasHitSomething = true;
            nearest_t = temp_t;
            nearest_hitNormal = temp_hitNormal;
            nearest_hitPos = temp_hitPos;
            nearest_hitMatID = Cylinder[i].materialID;
        }
    }
    // intersection with torus
    for(int i = 0; i<NUM_TORUS; i++) {
        if( torusRayIntersection(ray, Torus[i], MARCH_EPSILO, nearest_t, temp_t, temp_hitPos, temp_hitNormal))
        {
            nearest_t = temp_t;
            nearest_hitPos = temp_hitPos;
            nearest_hitNormal = temp_hitNormal;
            nearest_hitMatID = Torus[i].materialID;
            hasHitSomething = true;
        }
    }

    // One of the output results.
    hasHit = hasHitSomething;
    if ( !hasHitSomething ) return BACKGROUND_COLOR;

    vec3 I_local = vec3( 0.0 );  // Result color will be accumulated here.

    /////////////////////////////////////////////////////////////////////////////
    // TASK:
    // * Accumulate lighting from each light source on the nearest hit point.
    //   They are all accumulated into I_local.
    // * For each light source, make a shadow ray, and check if the shadow ray
    //   intersects any of the objects (the planes and spheres) between the
    //   nearest hit point and the light source.
    // * Then, call PhongLighting() to compute lighting for this light source.
    /////////////////////////////////////////////////////////////////////////////

    /////////////////////////////////
    // TASK: WRITE YOUR CODE HERE. //
    /////////////////////////////////
    for(int lightIdx = 0; lightIdx < NUM_LIGHTS; lightIdx++) 
    {
        vec3 toLight = normalize(Light[lightIdx].position - nearest_hitPos);
        vec3 shadowRayOrigin = nearest_hitPos + DEFAULT_TMIN * toLight;
        Ray_t shadowRay;
        shadowRay.o = shadowRayOrigin;
        shadowRay.d = toLight;
        
        Ray_t ShadowRay;
        bool isInShadow = false;
        for(int planeIdx = 0; planeIdx < NUM_PLANES; planeIdx++)
        {
            if ( IntersectPlane(Plane[planeIdx], shadowRay, DEFAULT_TMIN, length(Light[lightIdx].position - nearest_hitPos)) )
            {
                isInShadow = true;
                break;
            }
        }
        for(int sphereIdx = 0; sphereIdx < NUM_SPHERES; sphereIdx++)
        {
            if ( IntersectSphere(Sphere[sphereIdx], shadowRay, DEFAULT_TMIN, length(Light[lightIdx].position - nearest_hitPos)) )
            {
                isInShadow = true;
                break;
            }
        }
        for(int cylinderIdx = 0; cylinderIdx < NUM_Cylinder; cylinderIdx++)
        {
            if ( IntersectCylinder(Cylinder[cylinderIdx], shadowRay, DEFAULT_TMIN, length(Light[lightIdx].position - nearest_hitPos)) )
            {
                isInShadow = true;
                break;
            }
        }
         
        for(int truIdx = 0; truIdx < NUM_TORUS; truIdx++) {
            if(IntersectTorus(Torus[truIdx], shadowRay, DEFAULT_TMIN/10.0, length(Light[lightIdx].position - nearest_hitPos))) {
                isInShadow = true;
                break;
            }
        }
        
        

        vec3 V = -ray.d;
        if(nearest_hitMatID == DISCO_COLOR)
             I_local += PhongLighting(ShadowRay.d, nearest_hitNormal, -ray.d, isInShadow, Light[lightIdx], nearest_hitPos, hitWhichPlane);
        else if(nearest_hitMatID == CYBER_MATERIAL){
            I_local += SphereTextureLighting(Sphere[CYBER_PHERE], nearest_hitPos, toLight, nearest_hitNormal, V, 
                             isInShadow,  Light[lightIdx],  Material[CYBER_MATERIAL]);
        
        } else{
            I_local += PhongLighting(toLight, nearest_hitNormal, V, isInShadow, Material[nearest_hitMatID], Light[lightIdx]);
        }
    }




    // Populate output results.
    hitPos = nearest_hitPos;
    hitNormal = nearest_hitNormal;
    k_rg = Material[nearest_hitMatID].k_rg;

    return I_local;
}



/////////////////////////////////////////////////////////////////////////////
// Execution of fragment shader starts here.
// 1. Initializes the scene.
// 2. Compute a primary ray for the current pixel (fragment).
// 3. Trace ray into the scene with NUM_ITERATIONS recursion levels.
/////////////////////////////////////////////////////////////////////////////
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // blockNum = 10.0*abs(sin(0.6*PI*iTime)+1.5);
    InitScene();

    // Scale pixel 2D position such that its y coordinate is in [-1.0, 1.0].
    vec2 pixel_pos = (2.0 * fragCoord.xy - iResolution.xy) / iResolution.y;

    float frequency = 0.3;
    float radius = 6.;
    // 目标点在1/4圆周上的弧长（范围在[0, π/2]，即0到90度）
    float angle = 0.25 * PI * sin(2.0 * PI * frequency * iTime) + 0.3 * PI;
    // 计算目标点在1/4圆周上的x和z坐标
    float cam_x = cos(angle) * radius;
    float cam_z = sin(angle) * radius;

    // Position the camera.
    vec3 cam_pos = vec3( cam_x, 1.0, cam_z );
    vec3 cam_lookat = vec3( 0.25, 1.0, 0.0 );
    vec3 cam_up_vec = vec3( 0.0, 1.0, 0.0 );

    // Set up camera coordinate frame in world space.
    vec3 cam_z_axis = normalize( cam_pos - cam_lookat );
    vec3 cam_x_axis = normalize( cross(cam_up_vec, cam_z_axis) );
    vec3 cam_y_axis = normalize( cross(cam_z_axis, cam_x_axis));

    // Create primary ray.
    float pixel_pos_z = -1.0 / tan(FOVY / 2.0);
    Ray_t pRay;
    pRay.o = cam_pos;
    pRay.d = normalize( pixel_pos.x * cam_x_axis  +  pixel_pos.y * cam_y_axis  +  pixel_pos_z * cam_z_axis );


    // Start Ray Tracing.
    // Use iterations to emulate the recursion.

    vec3 I_result = vec3( 0.0 );
    vec3 compounded_k_rg = vec3( 1.0 );
    Ray_t nextRay = pRay;

    for ( int level = 0; level <= NUM_ITERATIONS; level++ )
    {
        bool hasHit;
        vec3 hitPos, hitNormal, k_rg;

        vec3 I_local = CastRay( nextRay, hasHit, hitPos, hitNormal, k_rg );

        I_result += compounded_k_rg * I_local;

        if ( !hasHit ) break;

        compounded_k_rg *= k_rg;

        nextRay = Ray_t( hitPos, normalize( reflect(nextRay.d, hitNormal) ) );
    }

    fragColor = vec4( I_result, 1.0 );
}