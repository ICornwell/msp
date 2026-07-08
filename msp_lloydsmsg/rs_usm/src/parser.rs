use nom::{
    bytes::complete::{is_not, take_while_m_n},
    character::complete::{char, multispace0},
    combinator::{map, opt},
    multi::{many0, separated_list0},
    sequence::preceded,
    IResult,
    Parser,
};
use crate::models::RawSegment;

// For this initial parser, we will hardcode the standard EDIFACT delimiters
// and ignore the UNA segment complexity just to get a working tree.
// Segment terminator = '
// Element separator = +
// Component separator = :
// Release char = ? (To be implemented later if needed)

fn parse_tag(input: &str) -> IResult<&str, String> {
    map(
        take_while_m_n(3, 3, |c: char| c.is_ascii_alphanumeric()),
        |s: &str| s.to_string(),
    ).parse(input)
}

fn parse_component(input: &str) -> IResult<&str, String> {
    map(
        is_not("+:'\r\n"),
        |s: &str| s.to_string(),
    ).parse(input)
}

fn parse_element(input: &str) -> IResult<&str, Vec<String>> {
    separated_list0(char(':'), parse_component).parse(input)
}

fn parse_raw_segment(input: &str) -> IResult<&str, RawSegment> {
    let (input, _) = multispace0(input)?;
    let (input, segment_tag) = parse_tag(input)?;
    
    // Elements follow the tag after a '+'
    // Some segments might just be a tag with no elements before the terminator (rare, but possible)
    let (input, elements) = opt(preceded(
        char('+'),
        separated_list0(char('+'), parse_element),
    )).parse(input)?;

    let elements = elements.unwrap_or_default();

    // Terminator
    let (input, _) = char('\'')(input)?;

    Ok((input, RawSegment {
        tag: segment_tag,
        elements,
    }))
}

pub fn parse_usm(input: &str) -> Result<Vec<RawSegment>, String> {
    let (remaining, segments) = many0(parse_raw_segment).parse(input)
        .map_err(|e| format!("Failed to parse: {:?}", e))?;
    
    if !remaining.trim().is_empty() {
        return Err(format!("Unparsed trailing data: {}", remaining));
    }
    
    Ok(segments)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_raw_segment() {
        let input = "UNB+UNOA:1+SENDER+RECEIVER+20250706:1200+12345'";
        let (rem, seg) = parse_raw_segment(input).unwrap();
        assert_eq!(rem, "");
        assert_eq!(seg.tag, "UNB");
        assert_eq!(seg.elements.len(), 5);
        assert_eq!(seg.elements[0], vec!["UNOA", "1"]);
        assert_eq!(seg.elements[1], vec!["SENDER"]);
    }

    #[test]
    fn test_full_parse() {
        let input = "UNB+UNOA:1+SENDER+RECEIVER+20250706:1200+12345'\nUNH+1+USM:D:98B:UN'\nUNT+2+1'";
        let segs = parse_usm(input).unwrap();
        assert_eq!(segs.len(), 3);
        assert_eq!(segs[0].tag, "UNB");
        assert_eq!(segs[1].tag, "UNH");
        assert_eq!(segs[2].tag, "UNT");
    }
}

#[cfg(test)]
mod proptests {
    use super::*;
    use proptest::prelude::*;

    prop_compose! {
        fn component()(s in "[A-Z0-9]{1,10}") -> String {
            s
        }
    }

    prop_compose! {
        fn element()(comps in prop::collection::vec(component(), 1..=4)) -> String {
            comps.join(":")
        }
    }

    prop_compose! {
        fn segment()(tag in "[A-Z]{3}", elements in prop::collection::vec(element(), 0..=5)) -> String {
            if elements.is_empty() {
                format!("{}'", tag)
            } else {
                format!("{}+{}'", tag, elements.join("+"))
            }
        }
    }

    prop_compose! {
        fn usm_message()(segs in prop::collection::vec(segment(), 1..=20)) -> String {
            segs.join("\n")
        }
    }

    proptest! {
        // Ensures that our parser successfully builds a tree for ANY valid EDIFACT shape
        #[test]
        fn parses_any_structurally_valid_edifact(s in usm_message()) {
            let res = parse_usm(&s);
            prop_assert!(res.is_ok(), "Failed to parse structurally valid EDIFACT string: {}", s);
        }

        // Ensures that randomly generated garsete data never panics the parser
        #[test]
        fn survives_random_garsete(s in "\\PC*") {
            // We don't care if it errors, we just assert it doesn't panic/crash
            let _ = parse_usm(&s);
        }
    }
}
