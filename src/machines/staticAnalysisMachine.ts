/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { DefaultReviewComment } from "@atomist/automation-client/operations/review/ReviewResult";
import { saveFromFiles } from "@atomist/automation-client/project/util/projectUtils";
import {
    CachingProjectLoader,
    EphemeralLocalArtifactStore,
    Goals,
    IsJava,
    ReviewerRegistration,
    ReviewGoal,
    SoftwareDeliveryMachine,
    SoftwareDeliveryMachineOptions,
    whenPushSatisfies,
} from "@atomist/sdm";
import { addDemoEditors } from "../parts/demo/demoEditors";
import { addCheckstyleSupport, CheckstyleSupportOptions } from "../parts/stacks/checkstyleSupport";
import { MaterialChangeToJavaRepo } from "../pushtest/jvm/materialChangeToJavaRepo";

export type StaticAnalysisMachineOptions = SoftwareDeliveryMachineOptions & CheckstyleSupportOptions;

/**
 * Assemble a machine that performs only static analysis.
 * @return {SoftwareDeliveryMachine}
 */
export function staticAnalysisMachine(opts: Partial<StaticAnalysisMachineOptions> = {}): SoftwareDeliveryMachine {
    const options: StaticAnalysisMachineOptions = {
        artifactStore: new EphemeralLocalArtifactStore(),
        projectLoader: new CachingProjectLoader(),
        useCheckstyle: true,
        reviewOnlyChangedFiles: false,
        ...opts,
    };
    const sdm = new SoftwareDeliveryMachine(
        "Static analysis SDM",
        options,
        whenPushSatisfies(IsJava, MaterialChangeToJavaRepo)
            .itMeans("Change to Java")
            .setGoals(new Goals("Review only", ReviewGoal)));
    addCheckstyleSupport(sdm, options);
    sdm.addReviewerRegistrations(rodHatesYaml, hasNoReadMe);

    addDemoEditors(sdm);
    return sdm;
}

const rodHatesYaml: ReviewerRegistration = {
    name: "rodHatesYaml",
    action: async cri => ({
        repoId: cri.project.id,
        comments:
            await saveFromFiles(cri.project, "**/*.yml", f =>
                new DefaultReviewComment("info", "yml-reviewer",
                    `Found YML in \`${f.path}\`: Rod regards the format as an insult to computer science`,
                    {
                        path: f.path,
                        lineFrom1: 1,
                        offset: -1,
                    })),
    }),
};

const hasNoReadMe: ReviewerRegistration = {
    name: "hasNoReadme",
    action: async cri => ({
        repoId: cri.project.id,
        comments: !!(await cri.project.getFile("README.me")) ?
            [] :
            [new DefaultReviewComment("info", "readme",
                "Project has no README",
                {
                    path: "README.md",
                    lineFrom1: 1,
                    offset: -1,
                })],
    }),
};
