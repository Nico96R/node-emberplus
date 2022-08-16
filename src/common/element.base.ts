export abstract class ElementBase {
    public _parent: ElementBase;

    isCommand(): boolean {
        return false;
    }

    isInvocationResult(): boolean {
        return false;
    }

    isNode(): boolean {
        return false;
    }

    isMatrix(): boolean {
        return false;
    }

    isParameter(): boolean {
        return false;
    }

    isFunction(): boolean {
        return false;
    }

    isRoot(): boolean {
        return false;
    }

    isQualified(): boolean {
        return false;
    }

    isStream(): boolean {
        return false;
    }

    isTemplate(): boolean {
        return false;
    }
}
