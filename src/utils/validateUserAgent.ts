import { exactly, createRegExp, charNotIn, oneOrMore } from "magic-regexp";

export function isValidUserAgent(ua: string): boolean | string {
    if (!ua || ua.trim() === '') return "User agent is required";

    const nonSpace = charNotIn(" ");
    const nonAtOrSpace = charNotIn(" @");
    

    const emailPart = oneOrMore(nonAtOrSpace)
        .and("@")
        .and(oneOrMore(nonAtOrSpace))
        .and(".")
        .and(oneOrMore(nonAtOrSpace));


    const nameOrUrlPart = oneOrMore(nonSpace)
        .and(
            oneOrMore(
                exactly(" ").and(oneOrMore(nonSpace))
            ).optionally()
        );

    const regex = createRegExp(
        nameOrUrlPart
        .and(exactly(" - "))
        .and(emailPart)
        .at.lineStart()
        .at.lineEnd()
    );

    if (regex.test(ua)) {
        return true;
    }

    return "Invalid format. Expected: '<name> [url] - <email>' (e.g., 'acmeco bgp.tools - contact@acme.co')";
}