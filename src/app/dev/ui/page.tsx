import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Divider } from "@/components/ui/divider";
import { Grid } from "@/components/ui/grid";
import { PageContainer } from "@/components/common/page-container";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Section } from "@/components/ui/section";
import { Stack } from "@/components/ui/stack";

export const metadata: Metadata = {
  title: "Busal Design System",
  description: "Internal UI Playground",
};

const buttonVariants = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "link",
  "destructive",
  "success",
  "warning",
] as const;

const buttonSizes = ["default", "sm", "lg", "icon"] as const;

const scrollItems = Array.from({ length: 20 }, (_, i) => i + 1);

export default function DevUiPage() {
  return (
    <PageContainer title="Busal Design System" description="Internal UI Playground">
      <Stack gap="xl">
        {/* Section 1 — Typography */}
        <Section spacing="lg">
          <Stack gap="md">
            <h2 className="text-lg font-semibold tracking-tight">Typography</h2>
            <Divider />
            <Stack gap="sm">
              <h1 className="text-3xl font-bold tracking-tight">Heading 1</h1>
              <h2 className="text-2xl font-semibold tracking-tight">Heading 2</h2>
              <h3 className="text-xl font-medium tracking-tight">Heading 3</h3>
              <p className="text-base">Large text — the default body size for general content.</p>
              <p className="text-muted-foreground">Muted text — used for secondary descriptions.</p>
              <p className="text-sm">Small text — used for captions and metadata.</p>
            </Stack>
          </Stack>
        </Section>

        {/* Section 2 — Buttons */}
        <Section spacing="lg">
          <Stack gap="md">
            <h2 className="text-lg font-semibold tracking-tight">Buttons</h2>
            <Divider />
            <Stack gap="md">
              <Stack gap="sm">
                <p className="text-muted-foreground text-sm">Variants</p>
                <Stack direction="row" gap="sm" wrap>
                  {buttonVariants.map((variant) => (
                    <Button key={variant} variant={variant}>
                      {variant}
                    </Button>
                  ))}
                </Stack>
              </Stack>
              <Stack gap="sm">
                <p className="text-muted-foreground text-sm">Sizes</p>
                <Stack direction="row" gap="sm" align="center" wrap>
                  {buttonSizes.map((size) => (
                    <Button key={size} size={size}>
                      {size === "icon" ? "A" : size}
                    </Button>
                  ))}
                </Stack>
              </Stack>
              <Stack gap="sm">
                <p className="text-muted-foreground text-sm">States</p>
                <Stack direction="row" gap="sm" wrap>
                  <Button loading>loading</Button>
                  <Button disabled>disabled</Button>
                  <Button fullWidth>full width</Button>
                </Stack>
              </Stack>
            </Stack>
          </Stack>
        </Section>

        {/* Section 3 — Cards */}
        <Section spacing="lg">
          <Stack gap="md">
            <h2 className="text-lg font-semibold tracking-tight">Cards</h2>
            <Divider />
            <Grid cols={2} responsive>
              <Card>
                <CardHeader>
                  <CardTitle>Default Card</CardTitle>
                  <CardDescription>Standard surface with border and shadow.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Content sits inside the card body.</p>
                </CardContent>
              </Card>

              <Card variant="outline">
                <CardHeader>
                  <CardTitle>Outline Card</CardTitle>
                  <CardDescription>Transparent background, border only.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Content sits inside the card body.</p>
                </CardContent>
              </Card>

              <Card variant="muted">
                <CardHeader>
                  <CardTitle>Muted Card</CardTitle>
                  <CardDescription>Subtle muted background.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Content sits inside the card body.</p>
                </CardContent>
              </Card>

              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>Elevated Card</CardTitle>
                  <CardDescription>Larger shadow for emphasis.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Content sits inside the card body.</p>
                </CardContent>
              </Card>

              <Card interactive>
                <CardHeader>
                  <CardTitle>Interactive Card</CardTitle>
                  <CardDescription>Hover and focus for clickable cards.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Hover to see the shadow lift.</p>
                </CardContent>
              </Card>

              <Card loading>
                <CardHeader>
                  <CardTitle>Loading Card</CardTitle>
                  <CardDescription>Skeleton placeholder while content loads.</CardDescription>
                </CardHeader>
              </Card>
            </Grid>
          </Stack>
        </Section>

        {/* Section 4 — Grid */}
        <Section spacing="lg">
          <Stack gap="md">
            <h2 className="text-lg font-semibold tracking-tight">Grid</h2>
            <Divider />
            <Stack gap="lg">
              <Stack gap="sm">
                <p className="text-muted-foreground text-sm">2-column grid</p>
                <Grid cols={2} responsive>
                  <Card variant="outline">
                    <CardContent className="p-4">
                      <p className="text-center text-sm">Column 1</p>
                    </CardContent>
                  </Card>
                  <Card variant="outline">
                    <CardContent className="p-4">
                      <p className="text-center text-sm">Column 2</p>
                    </CardContent>
                  </Card>
                </Grid>
              </Stack>

              <Stack gap="sm">
                <p className="text-muted-foreground text-sm">3-column grid</p>
                <Grid cols={3} responsive>
                  <Card variant="outline">
                    <CardContent className="p-4">
                      <p className="text-center text-sm">Column 1</p>
                    </CardContent>
                  </Card>
                  <Card variant="outline">
                    <CardContent className="p-4">
                      <p className="text-center text-sm">Column 2</p>
                    </CardContent>
                  </Card>
                  <Card variant="outline">
                    <CardContent className="p-4">
                      <p className="text-center text-sm">Column 3</p>
                    </CardContent>
                  </Card>
                </Grid>
              </Stack>

              <Stack gap="sm">
                <p className="text-muted-foreground text-sm">Auto-fit grid</p>
                <Grid autoFit>
                  {Array.from({ length: 6 }, (_, i) => (
                    <Card key={i} variant="outline">
                      <CardContent className="p-4">
                        <p className="text-center text-sm">Item {i + 1}</p>
                      </CardContent>
                    </Card>
                  ))}
                </Grid>
              </Stack>
            </Stack>
          </Stack>
        </Section>

        {/* Section 5 — Stack */}
        <Section spacing="lg">
          <Stack gap="md">
            <h2 className="text-lg font-semibold tracking-tight">Stack</h2>
            <Divider />
            <Stack gap="lg">
              <Stack gap="sm">
                <p className="text-muted-foreground text-sm">Vertical stack (gap md)</p>
                <Card variant="outline">
                  <CardContent className="p-4">
                    <Stack gap="md">
                      <div className="bg-muted rounded-md p-3 text-center text-sm">Item A</div>
                      <div className="bg-muted rounded-md p-3 text-center text-sm">Item B</div>
                      <div className="bg-muted rounded-md p-3 text-center text-sm">Item C</div>
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>

              <Stack gap="sm">
                <p className="text-muted-foreground text-sm">Horizontal stack (gap md)</p>
                <Card variant="outline">
                  <CardContent className="p-4">
                    <Stack direction="row" gap="md" wrap>
                      <div className="bg-muted rounded-md p-3 text-center text-sm">Item A</div>
                      <div className="bg-muted rounded-md p-3 text-center text-sm">Item B</div>
                      <div className="bg-muted rounded-md p-3 text-center text-sm">Item C</div>
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>

              <Stack gap="sm">
                <p className="text-muted-foreground text-sm">Gap sizes (xs, sm, md, lg, xl)</p>
                <Card variant="outline">
                  <CardContent className="p-4">
                    <Stack gap="sm">
                      <Stack direction="row" gap="xs" align="center">
                        <span className="text-muted-foreground w-8 text-xs">xs</span>
                        <div className="bg-muted h-8 w-8 rounded-md" />
                        <div className="bg-muted h-8 w-8 rounded-md" />
                        <div className="bg-muted h-8 w-8 rounded-md" />
                      </Stack>
                      <Stack direction="row" gap="sm" align="center">
                        <span className="text-muted-foreground w-8 text-xs">sm</span>
                        <div className="bg-muted h-8 w-8 rounded-md" />
                        <div className="bg-muted h-8 w-8 rounded-md" />
                        <div className="bg-muted h-8 w-8 rounded-md" />
                      </Stack>
                      <Stack direction="row" gap="md" align="center">
                        <span className="text-muted-foreground w-8 text-xs">md</span>
                        <div className="bg-muted h-8 w-8 rounded-md" />
                        <div className="bg-muted h-8 w-8 rounded-md" />
                        <div className="bg-muted h-8 w-8 rounded-md" />
                      </Stack>
                      <Stack direction="row" gap="lg" align="center">
                        <span className="text-muted-foreground w-8 text-xs">lg</span>
                        <div className="bg-muted h-8 w-8 rounded-md" />
                        <div className="bg-muted h-8 w-8 rounded-md" />
                        <div className="bg-muted h-8 w-8 rounded-md" />
                      </Stack>
                      <Stack direction="row" gap="xl" align="center">
                        <span className="text-muted-foreground w-8 text-xs">xl</span>
                        <div className="bg-muted h-8 w-8 rounded-md" />
                        <div className="bg-muted h-8 w-8 rounded-md" />
                        <div className="bg-muted h-8 w-8 rounded-md" />
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            </Stack>
          </Stack>
        </Section>

        {/* Section 6 — Divider */}
        <Section spacing="lg">
          <Stack gap="md">
            <h2 className="text-lg font-semibold tracking-tight">Divider</h2>
            <Divider />
            <Stack gap="lg">
              <Stack gap="sm">
                <p className="text-muted-foreground text-sm">Horizontal divider</p>
                <Divider />
              </Stack>

              <Stack gap="sm">
                <p className="text-muted-foreground text-sm">Divider with label</p>
                <Divider label="OR" />
              </Stack>

              <Stack gap="sm">
                <p className="text-muted-foreground text-sm">Vertical divider</p>
                <Stack direction="row" gap="md" align="center">
                  <span className="text-sm">Left</span>
                  <Divider orientation="vertical" className="h-8" />
                  <span className="text-sm">Right</span>
                </Stack>
              </Stack>
            </Stack>
          </Stack>
        </Section>

        {/* Section 7 — Scroll Area */}
        <Section spacing="lg">
          <Stack gap="md">
            <h2 className="text-lg font-semibold tracking-tight">Scroll Area</h2>
            <Divider />
            <Card variant="outline">
              <CardContent className="p-4">
                <ScrollArea className="h-64 w-full rounded-md border">
                  <Stack gap="sm" className="p-4">
                    {scrollItems.map((item) => (
                      <div
                        key={item}
                        className="bg-muted flex items-center justify-between rounded-md p-3"
                      >
                        <span className="text-sm font-medium">Row {item}</span>
                        <span className="text-muted-foreground text-xs">
                          Scrollable item {item} of {scrollItems.length}
                        </span>
                      </div>
                    ))}
                  </Stack>
                </ScrollArea>
              </CardContent>
            </Card>
          </Stack>
        </Section>
      </Stack>
    </PageContainer>
  );
}
