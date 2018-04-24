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

import { Success } from "@atomist/automation-client";
import {
    DefaultDockerImageNameCreator,
    DockerBuildGoal,
    DockerOptions,
    executeDockerBuild,
    executeTag,
    executeVersioner,
    IsNode,
    NodeProjectIdentifier,
    NodeProjectVersioner,
    NpmPublishGoal, PackageLockFingerprinter,
    ProductionDockerDeploymentGoal,
    SoftwareDeliveryMachine,
    SoftwareDeliveryMachineOptions,
    StagingDockerDeploymentGoal,
    TagGoal,
    tagRepo,
    tslintFix,
    VersionGoal,
} from "@atomist/sdm";
import { executePublish } from "@atomist/sdm/common/delivery/build/local/npm/executePublish";
import { nodeTagger } from "@atomist/spring-automation/commands/tag/nodeTagger";
import { AddAtomistTypeScriptHeader } from "../../blueprint/code/autofix/addAtomistHeader";
import { AddBuildScript } from "../../blueprint/code/autofix/addBuildScript";
import { CommonGeneratorConfig } from "../../machines/generatorConfig";
import { CommonTypeScriptErrors } from "../team/commonTypeScriptErrors";
import { DontImportOwnIndex } from "../team/dontImportOwnIndex";

/**
 * Add configuration common to Node SDMs, wherever they deploy
 * @param {SoftwareDeliveryMachine} sdm
 * @param options config options
 */
export function addNodeSupport(sdm: SoftwareDeliveryMachine,
    options: SoftwareDeliveryMachineOptions & DockerOptions) {
    sdm.addNewRepoWithCodeActions(
        tagRepo(nodeTagger),
    )
        .addAutofixes(
            AddAtomistTypeScriptHeader,
            tslintFix,
            AddBuildScript,
    )
        .addReviewerRegistrations(
            CommonTypeScriptErrors,
            DontImportOwnIndex,
    )
        .addFingerprinterRegistrations(new PackageLockFingerprinter())
        .addGoalImplementation("nodeVersioner", VersionGoal,
            executeVersioner(options.projectLoader, NodeProjectVersioner))
        .addGoalImplementation("nodeDockerBuild", DockerBuildGoal,
            executeDockerBuild(
                options.projectLoader,
                async () => "", // TODO CD this is very broken but fixed on my branch
                async () => Success, // TODO CD at least add the compile step to this
                DefaultDockerImageNameCreator,
                {
                    registry: options.registry,
                    user: options.user,
                    password: options.password,

                    dockerfileFinder: async () => "Dockerfile",
                }))
        .addGoalImplementation("nodeTag", TagGoal,
            executeTag(options.projectLoader))
        .addGoalImplementation("nodePublish", NpmPublishGoal,
            executePublish(options.projectLoader, NodeProjectIdentifier));

    sdm.goalFulfillmentMapper.addSideEffect({
        goal: StagingDockerDeploymentGoal,
        pushTest: IsNode,
        sideEffectName: "@atomist/k8-automation",
    }).addSideEffect({
        goal: ProductionDockerDeploymentGoal,
        pushTest: IsNode,
        sideEffectName: "@atomist/k8-automation",
    });
}
