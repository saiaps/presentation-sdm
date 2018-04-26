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

import { HandleCommand, HandlerContext } from "@atomist/automation-client";
import { AnyProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { chainEditors } from "@atomist/automation-client/operations/edit/projectEditorOps";
import {
    GeneratorCommandDetails,
    generatorHandler,
} from "@atomist/automation-client/operations/generate/generatorToCommand";
import { GeneratorConfig } from "@atomist/sdm";
import { updateBuildScripts, resetReadme, removeFile } from "../../editors/node/updatePackageJsonIdentification";
import { updateReadmeTitle } from "../../editors/updateReadmeTitle";
import { PresentationProjectCreationParameters } from "./PresentationProjectCreationParameters";

export function presentationGenerator(config: GeneratorConfig,
    details: Partial<GeneratorCommandDetails<PresentationProjectCreationParameters>> = {}): HandleCommand {
    return generatorHandler<PresentationProjectCreationParameters>(
        transformSeed,
        () => new PresentationProjectCreationParameters(config),
        `presGenerator-${config.seedRepo}`,
        {
            tags: ["keynote", "generator"],
            ...details,
            intent: config.intent,
        });
}

function transformSeed(params: PresentationProjectCreationParameters, ctx: HandlerContext): AnyProjectEditor<PresentationProjectCreationParameters> {
    return chainEditors(
        updateBuildScripts(params.presentationFileName),
        resetReadme(params.presentationFileName),
        removeFile("seamap.pdf"),
    );
}
